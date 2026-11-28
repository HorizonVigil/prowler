"""Tests for the TLS-aware Neo4j URI helper and the Aura API provisioner.

These cover the two pieces that let attack-paths target managed AuraDB Business
Critical: the `neo4j+s://` scheme toggle, and the management-API client that
replaces Cypher `CREATE/DROP DATABASE` (which Aura forbids).
"""

from unittest.mock import MagicMock

import pytest
import requests
from api.attack_paths import aura_api, neo4j_uri
from api.attack_paths.aura_api import AuraApiError, AuraApiProvisioner


def _encrypt(settings, enabled: bool) -> None:
    """Flip the ENCRYPTED flag on the neo4j DATABASES entry for one test."""
    settings.DATABASES = {
        **settings.DATABASES,
        "neo4j": {**settings.DATABASES["neo4j"], "ENCRYPTED": enabled},
    }


class TestNeo4jUri:
    def test_plaintext_scheme_by_default(self, settings):
        _encrypt(settings, False)
        assert neo4j_uri.neo4j_scheme() == "bolt"
        assert neo4j_uri.build_neo4j_uri("host", 7687) == "bolt://host:7687"

    def test_encrypted_scheme_when_enabled(self, settings):
        _encrypt(settings, True)
        assert neo4j_uri.neo4j_scheme() == "neo4j+s"
        assert (
            neo4j_uri.build_neo4j_uri("x.databases.neo4j.io", 7687)
            == "neo4j+s://x.databases.neo4j.io:7687"
        )

    def test_missing_flag_is_plaintext(self, settings):
        settings.DATABASES = {
            **settings.DATABASES,
            "neo4j": {
                k: v for k, v in settings.DATABASES["neo4j"].items() if k != "ENCRYPTED"
            },
        }
        assert neo4j_uri.is_encrypted() is False
        assert neo4j_uri.neo4j_scheme() == "bolt"


def _response(status_code: int, json_body=None, text: str = "") -> MagicMock:
    resp = MagicMock(spec=requests.Response)
    resp.status_code = status_code
    resp.json.return_value = json_body
    resp.text = text
    return resp


def _make_provisioner(session: MagicMock) -> AuraApiProvisioner:
    return AuraApiProvisioner(
        client_id="cid",
        client_secret="csecret",
        org_id="org1",
        project_id="proj1",
        instance_id="inst1",
        session=session,
    )


def _token_response() -> MagicMock:
    return _response(
        200, {"access_token": "tok", "expires_in": 3600, "token_type": "bearer"}
    )


class TestProvisionerConfig:
    def test_missing_settings_raise(self):
        with pytest.raises(AuraApiError, match="AURA_API_INSTANCE_ID"):
            AuraApiProvisioner(
                client_id="cid",
                client_secret="csecret",
                org_id="org1",
                project_id="proj1",
                instance_id="",
            )

    def test_databases_url_is_scoped_to_instance(self):
        prov = _make_provisioner(MagicMock())
        assert prov._databases_url == (
            "https://api.neo4j.io/v2beta1/organizations/org1"
            "/projects/proj1/instances/inst1/databases"
        )


class TestToken:
    def test_token_is_fetched_once_and_cached(self):
        session = MagicMock()
        session.post.return_value = _token_response()
        session.request.return_value = _response(200, {"data": []})
        prov = _make_provisioner(session)

        prov.list_databases()
        prov.list_databases()

        # One token POST despite two API calls.
        assert session.post.call_count == 1
        _, kwargs = session.post.call_args
        assert kwargs["auth"] == ("cid", "csecret")
        assert kwargs["data"] == {"grant_type": "client_credentials"}

    def test_token_request_failure_raises(self):
        session = MagicMock()
        session.post.return_value = _response(401, text="bad creds")
        prov = _make_provisioner(session)
        with pytest.raises(AuraApiError, match="401"):
            prov.list_databases()

    def test_token_refreshed_once_on_403(self):
        session = MagicMock()
        session.post.return_value = _token_response()
        # First API call: expired token (403); second: success.
        session.request.side_effect = [
            _response(403, text="token expired"),
            _response(200, {"data": []}),
        ]
        prov = _make_provisioner(session)

        assert prov.list_databases() == []
        assert session.post.call_count == 2  # initial + forced refresh
        assert session.request.call_count == 2


class TestListDatabases:
    def test_parses_wrapped_envelope(self):
        session = MagicMock()
        session.post.return_value = _token_response()
        session.request.return_value = _response(
            200, {"data": [{"id": "1", "name": "neo4j"}, {"id": "2", "name": "db-x"}]}
        )
        prov = _make_provisioner(session)
        assert prov.list_databases() == ["neo4j", "db-x"]

    def test_parses_bare_list(self):
        session = MagicMock()
        session.post.return_value = _token_response()
        session.request.return_value = _response(200, [{"id": "1", "name": "neo4j"}])
        prov = _make_provisioner(session)
        assert prov.list_databases() == ["neo4j"]

    def test_non_200_raises(self):
        session = MagicMock()
        session.post.return_value = _token_response()
        session.request.return_value = _response(500, text="boom")
        prov = _make_provisioner(session)
        with pytest.raises(AuraApiError, match="500"):
            prov.list_databases()


class TestCreateDatabase:
    def test_creates_when_absent(self):
        session = MagicMock()
        session.post.return_value = _token_response()
        session.request.side_effect = [
            _response(200, {"data": []}),  # list (not present)
            _response(202, {"data": {"id": "9", "name": "db-tmp-scan-abc"}}),  # create
        ]
        prov = _make_provisioner(session)
        prov.create_database("db-tmp-scan-abc")

        create_call = session.request.call_args_list[1]
        assert create_call.args[0] == "POST"
        assert create_call.kwargs["json"] == {"name": "db-tmp-scan-abc"}

    def test_skips_when_already_exists(self):
        session = MagicMock()
        session.post.return_value = _token_response()
        session.request.return_value = _response(
            200, {"data": [{"id": "1", "name": "db-tenant-x"}]}
        )
        prov = _make_provisioner(session)
        prov.create_database("db-tenant-x")
        # Only the list GET happened; no POST create.
        assert all(c.args[0] == "GET" for c in session.request.call_args_list)

    def test_create_error_raises(self):
        session = MagicMock()
        session.post.return_value = _token_response()
        session.request.side_effect = [
            _response(200, {"data": []}),  # list
            _response(400, text="invalid name"),  # create fails
        ]
        prov = _make_provisioner(session)
        with pytest.raises(AuraApiError, match="400"):
            prov.create_database("db-x")


class TestDropDatabase:
    def test_drops_by_resolved_id(self):
        session = MagicMock()
        session.post.return_value = _token_response()
        session.request.side_effect = [
            _response(200, {"data": [{"id": "42", "name": "db-tmp-scan-abc"}]}),  # list
            _response(202, {}),  # delete
        ]
        prov = _make_provisioner(session)
        prov.drop_database("db-tmp-scan-abc")

        delete_call = session.request.call_args_list[1]
        assert delete_call.args[0] == "DELETE"
        assert delete_call.args[1].endswith("/databases/42")

    def test_noop_when_absent(self):
        session = MagicMock()
        session.post.return_value = _token_response()
        session.request.return_value = _response(200, {"data": []})
        prov = _make_provisioner(session)
        prov.drop_database("db-missing")
        # Only the list GET; no DELETE.
        assert all(c.args[0] == "GET" for c in session.request.call_args_list)

    def test_404_on_delete_is_tolerated(self):
        session = MagicMock()
        session.post.return_value = _token_response()
        session.request.side_effect = [
            _response(200, {"data": [{"id": "7", "name": "db-x"}]}),  # list
            _response(404, text="gone"),  # delete races a concurrent drop
        ]
        prov = _make_provisioner(session)
        prov.drop_database("db-x")  # must not raise


class TestModuleHelpers:
    def test_enabled_reflects_setting(self, settings):
        settings.NEO4J_PROVISIONER = "cypher"
        assert aura_api.enabled() is False
        settings.NEO4J_PROVISIONER = "aura_api"
        assert aura_api.enabled() is True

    def test_get_provisioner_builds_from_settings(self, settings):
        settings.AURA_API = {
            "CLIENT_ID": "cid",
            "CLIENT_SECRET": "csecret",
            "ORG_ID": "org1",
            "PROJECT_ID": "proj1",
            "INSTANCE_ID": "inst1",
            "BASE_URL": "https://api.neo4j.io/v2beta1",
            "TOKEN_URL": "https://api.neo4j.io/oauth/token",
            "TIMEOUT": 45,
        }
        aura_api.reset_provisioner()
        try:
            prov = aura_api.get_provisioner()
            assert prov is aura_api.get_provisioner()  # cached singleton
            assert prov._databases_url.endswith("/instances/inst1/databases")
        finally:
            aura_api.reset_provisioner()
