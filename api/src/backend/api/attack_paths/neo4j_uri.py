"""Shared Neo4j bolt-URI construction.

Prowler historically hard-coded ``bolt://`` (unencrypted) for every Neo4j
connection. That works for a self-hosted cluster on a private network, but
managed Neo4j (Aura / AuraDB Business Critical) is TLS-only and must be reached
through the encrypted, routing-aware ``neo4j+s://`` scheme.

Encryption is opt-in via ``NEO4J_ENCRYPTED`` (surfaced as the ``ENCRYPTED`` key
on ``settings.DATABASES["neo4j"]``), so existing unencrypted deployments are
unaffected. When enabled, the scheme itself carries the TLS configuration, so
the driver must NOT also receive ``encrypted=`` / ``trust=`` keyword arguments
(that combination raises a neo4j ConfigurationError).
"""

from django.conf import settings

# ``neo4j+s`` = TLS + full certificate verification + server-side routing. This
# is the scheme Aura hands out and the only one it accepts.
ENCRYPTED_SCHEME = "neo4j+s"
PLAINTEXT_SCHEME = "bolt"


def is_encrypted() -> bool:
    """Whether the Neo4j connection should use TLS."""
    return bool(settings.DATABASES["neo4j"].get("ENCRYPTED", False))


def neo4j_scheme() -> str:
    """Return the bolt URI scheme for the configured encryption mode."""
    return ENCRYPTED_SCHEME if is_encrypted() else PLAINTEXT_SCHEME


def build_neo4j_uri(host: str, port: str | int) -> str:
    """Build a Neo4j connection URI, TLS-aware.

    ``neo4j+s://host:port`` when encryption is enabled, otherwise the legacy
    ``bolt://host:port``.
    """
    return f"{neo4j_scheme()}://{host}:{port}"
