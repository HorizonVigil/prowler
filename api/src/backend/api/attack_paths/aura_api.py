"""Neo4j Aura management-API database provisioner.

AuraDB Business Critical supports multiple databases per instance, but — unlike
a self-hosted Enterprise / DozerDB cluster — it forbids ``CREATE DATABASE`` /
``DROP DATABASE`` over Cypher. Databases must be created, listed and deleted
through the Aura management API (v2beta1) instead. This module is the API client
Prowler uses for that, selected by ``settings.NEO4J_PROVISIONER == "aura_api"``.

The provisioner exposes the same three operations the Cypher path does, so the
attack-paths pipeline is agnostic to which one is active:

- ``create_database(name)``  — idempotent (no-op if the database already exists)
- ``drop_database(name)``    — idempotent (no-op if the database is already gone)
- ``list_databases()``       — the database names on the instance

API shape (confirmed against the Aura docs, 2026-11):

- OAuth2 client-credentials token:
  ``POST https://api.neo4j.io/oauth/token`` with HTTP Basic auth
  (client id/secret) and form body ``grant_type=client_credentials``; the
  response is ``{"access_token", "expires_in", "token_type"}`` and tokens last
  ~1h. An expired token on an API call is reported as ``403``.
- Databases live under
  ``{base}/organizations/{org}/projects/{project}/instances/{instance}/databases``:
  ``POST`` to create (body ``{"name": ...}``), ``GET`` to list, and
  ``DELETE .../databases/{databaseId}`` to drop (by id, not name).

Because the v2beta1 OpenAPI spec was not publicly reachable, the exact response
envelopes are handled defensively: list parsing accepts both ``{"data": [...]}``
and a bare array, and create/delete treat any 2xx (and the already-exists /
already-gone conflict codes) as success.
"""

import logging
import threading
import time
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# Refresh the token this many seconds before its stated expiry, so an in-flight
# request never races the ~1h boundary.
_TOKEN_EXPIRY_SKEW_SECONDS = 60


class AuraApiError(RuntimeError):
    """An Aura management-API call failed."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class AuraApiProvisioner:
    """Thin client for Aura database create/list/drop with token caching."""

    def __init__(
        self,
        *,
        client_id: str,
        client_secret: str,
        org_id: str,
        project_id: str,
        instance_id: str,
        base_url: str = "https://api.neo4j.io/v2beta1",
        token_url: str = "https://api.neo4j.io/oauth/token",
        timeout: int = 45,
        session: requests.Session | None = None,
    ) -> None:
        missing = [
            name
            for name, value in (
                ("AURA_API_CLIENT_ID", client_id),
                ("AURA_API_CLIENT_SECRET", client_secret),
                ("AURA_API_ORG_ID", org_id),
                ("AURA_API_PROJECT_ID", project_id),
                ("AURA_API_INSTANCE_ID", instance_id),
            )
            if not value
        ]
        if missing:
            raise AuraApiError(
                "Aura API provisioner is enabled (NEO4J_PROVISIONER=aura_api) but "
                f"required settings are empty: {', '.join(missing)}"
            )

        self._client_id = client_id
        self._client_secret = client_secret
        self._base_url = base_url.rstrip("/")
        self._token_url = token_url
        self._timeout = timeout
        self._session = session or requests.Session()
        self._databases_url = (
            f"{self._base_url}/organizations/{org_id}"
            f"/projects/{project_id}/instances/{instance_id}/databases"
        )

        self._token: str | None = None
        self._token_expiry_monotonic = 0.0
        self._lock = threading.Lock()

    # Auth

    def _get_token(self, *, force_refresh: bool = False) -> str:
        with self._lock:
            now = time.monotonic()
            if (
                not force_refresh
                and self._token is not None
                and now < self._token_expiry_monotonic
            ):
                return self._token

            try:
                response = self._session.post(
                    self._token_url,
                    auth=(self._client_id, self._client_secret),
                    data={"grant_type": "client_credentials"},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=self._timeout,
                )
            except requests.RequestException as exc:
                raise AuraApiError(f"Aura token request failed: {exc}") from exc

            if response.status_code != 200:
                raise AuraApiError(
                    f"Aura token request returned {response.status_code}: "
                    f"{_body_snippet(response)}",
                    status_code=response.status_code,
                )

            body = response.json()
            token = body.get("access_token")
            if not token:
                raise AuraApiError("Aura token response did not contain access_token")

            expires_in = int(body.get("expires_in", 3600))
            self._token = token
            self._token_expiry_monotonic = now + max(
                0, expires_in - _TOKEN_EXPIRY_SKEW_SECONDS
            )
            return token

    def _request(
        self,
        method: str,
        url: str,
        *,
        json: dict[str, Any] | None = None,
    ) -> requests.Response:
        """Make an authenticated API request, refreshing the token once on 401/403."""
        for attempt in range(2):
            token = self._get_token(force_refresh=attempt == 1)
            try:
                response = self._session.request(
                    method,
                    url,
                    headers={"Authorization": f"Bearer {token}"},
                    json=json,
                    timeout=self._timeout,
                )
            except requests.RequestException as exc:
                raise AuraApiError(f"Aura API {method} {url} failed: {exc}") from exc

            # Aura reports an expired/invalid token as 401 or 403; retry once with
            # a freshly minted token before giving up.
            if response.status_code in (401, 403) and attempt == 0:
                logger.info(
                    "Aura API %s returned %s; refreshing token and retrying",
                    method,
                    response.status_code,
                )
                continue
            return response

        return response

    # Database operations

    def list_databases(self) -> list[str]:
        """Return the names of every database on the instance."""
        return [db["name"] for db in self._list_raw() if db.get("name")]

    def _list_raw(self) -> list[dict[str, Any]]:
        response = self._request("GET", self._databases_url)
        if response.status_code != 200:
            raise AuraApiError(
                f"Aura list databases returned {response.status_code}: "
                f"{_body_snippet(response)}",
                status_code=response.status_code,
            )
        body = response.json()
        # The list may be wrapped (`{"data": [...]}`, the Aura API convention) or
        # returned bare; accept either.
        data = body.get("data", body) if isinstance(body, dict) else body
        if not isinstance(data, list):
            raise AuraApiError(
                f"Aura list databases returned an unexpected shape: {type(data)!r}"
            )
        return data

    def create_database(self, name: str) -> None:
        """Create a database. No-op if it already exists (idempotent)."""
        if name in self.list_databases():
            logger.info("Aura database %r already exists; skipping create", name)
            return

        response = self._request("POST", self._databases_url, json={"name": name})
        if 200 <= response.status_code < 300:
            logger.info("Created Aura database %r", name)
            return
        # 409 Conflict: the name was created concurrently, or the instance does
        # not support multi-database. Only tolerate it if the database now exists.
        if response.status_code == 409 and name in self.list_databases():
            logger.info(
                "Aura database %r created concurrently; treating as success", name
            )
            return
        raise AuraApiError(
            f"Aura create database {name!r} returned {response.status_code}: "
            f"{_body_snippet(response)}",
            status_code=response.status_code,
        )

    def drop_database(self, name: str) -> None:
        """Delete a database by name. No-op if it does not exist (idempotent)."""
        database_id = self._database_id(name)
        if database_id is None:
            logger.info("Aura database %r not found; nothing to drop", name)
            return

        url = f"{self._databases_url}/{database_id}"
        response = self._request("DELETE", url)
        if 200 <= response.status_code < 300 or response.status_code == 404:
            logger.info("Dropped Aura database %r (id=%s)", name, database_id)
            return
        raise AuraApiError(
            f"Aura drop database {name!r} (id={database_id}) returned "
            f"{response.status_code}: {_body_snippet(response)}",
            status_code=response.status_code,
        )

    def _database_id(self, name: str) -> str | None:
        for db in self._list_raw():
            if db.get("name") == name:
                return db.get("id")
        return None


def _body_snippet(response: requests.Response, limit: int = 500) -> str:
    return (response.text or "")[:limit]


# Module-level singleton, built lazily from settings.

_provisioner: AuraApiProvisioner | None = None
_provisioner_lock = threading.Lock()


def enabled() -> bool:
    """Whether attack-paths databases are provisioned via the Aura API."""
    return settings.NEO4J_PROVISIONER == "aura_api"


def get_provisioner() -> AuraApiProvisioner:
    """Return the process-wide Aura provisioner, building it on first use."""
    global _provisioner
    if _provisioner is not None:
        return _provisioner
    with _provisioner_lock:
        if _provisioner is None:
            cfg = settings.AURA_API
            _provisioner = AuraApiProvisioner(
                client_id=cfg["CLIENT_ID"],
                client_secret=cfg["CLIENT_SECRET"],
                org_id=cfg["ORG_ID"],
                project_id=cfg["PROJECT_ID"],
                instance_id=cfg["INSTANCE_ID"],
                base_url=cfg["BASE_URL"],
                token_url=cfg["TOKEN_URL"],
                timeout=cfg["TIMEOUT"],
            )
    return _provisioner


def reset_provisioner() -> None:
    """Drop the cached provisioner. Used by tests and after settings changes."""
    global _provisioner
    with _provisioner_lock:
        _provisioner = None
