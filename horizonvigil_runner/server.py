from __future__ import annotations

import json
import os
import secrets
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / "prowler-cli.py"
ALLOWED_PROVIDERS = {"aws", "gcp", "azure", "kubernetes"}
MAX_TIMEOUT_SECONDS = int(os.getenv("PROWLER_SCAN_TIMEOUT_SECONDS", "900"))


def run_scan(provider: str) -> dict:
    if provider not in ALLOWED_PROVIDERS:
        raise ValueError("unsupported provider")
    with tempfile.TemporaryDirectory(prefix="hv-prowler-") as output:
        command = ["python", str(CLI), provider, "-M", "json-ocsf", "-o", output]
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=MAX_TIMEOUT_SECONDS, check=False)
        files = sorted(Path(output).glob("*.ocsf.json"))
        records: list[dict] = []
        for file in files:
            payload = json.loads(file.read_text(encoding="utf-8"))
            if isinstance(payload, list):
                records.extend(item for item in payload if item.get("status_code") == "FAIL")
        return {"provider": provider, "exitCode": result.returncode, "findings": records, "stderr": result.stderr[-4000:]}


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send(200, {"status": "ok", "service": "horizonvigil-prowler-runner"})
        else:
            self._send(404, {"error": "not_found"})

    def do_POST(self) -> None:
        if self.path != "/scan":
            self._send(404, {"error": "not_found"})
            return
        expected = os.getenv("INTERNAL_SCAN_SECRET", "")
        supplied = self.headers.get("X-Internal-Scan-Secret", "")
        if not expected or not secrets.compare_digest(supplied, expected):
            self._send(403, {"error": "forbidden"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 4096:
                self._send(400, {"error": "invalid_request_size"})
                return
            body = json.loads(self.rfile.read(length) or b"{}")
            if not isinstance(body, dict) or not isinstance(body.get("provider"), str) or body["provider"] not in ALLOWED_PROVIDERS:
                self._send(400, {"error": "unsupported_provider"})
                return
            if not all(isinstance(body.get(key), str) and body[key].strip() for key in ("tenant_id", "connection_id", "credential_ref")):
                self._send(400, {"error": "tenant_id, connection_id, and credential_ref are required"})
                return
            # Presence of an opaque reference does not establish a provider
            # identity. Never fall back to Cloud Run metadata credentials.
            self._send(503, {"error": "credential_broker_unavailable"})
        except subprocess.TimeoutExpired:
            self._send(504, {"error": "scan_timeout"})
        except (ValueError, json.JSONDecodeError) as exc:
            self._send(400, {"error": str(exc)})
        except Exception:
            self._send(500, {"error": "scan_failed"})

    def log_message(self, *_args: object) -> None:
        return


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
