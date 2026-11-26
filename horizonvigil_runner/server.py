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
            length = min(int(self.headers.get("Content-Length", "0")), 4096)
            body = json.loads(self.rfile.read(length) or b"{}")
            result = run_scan(str(body.get("provider", "")).lower())
            self._send(200 if result["exitCode"] == 0 else 502, result)
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
