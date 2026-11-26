# HorizonVigil Prowler runner

This is HorizonVigil-owned integration code around the vendored Prowler OSS
engine. Prowler's checks, provider code, and output formats remain covered by
the upstream Apache-2.0 license in `../LICENSE`.

The runner is intentionally narrow:

- `GET /health` is unauthenticated and does not touch cloud credentials.
- `POST /scan` requires `X-Internal-Scan-Secret`.
- Only AWS, GCP, Azure, and Kubernetes providers are accepted.
- Provider-specific credentials come from the runtime environment; request
  bodies cannot provide arbitrary shell arguments or credentials.
- Only failed OCSF records are returned to the caller.

The caller is responsible for passing the returned OCSF records through the
HorizonVigil normalization and tenant-isolation layer.
