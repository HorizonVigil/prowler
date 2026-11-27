import json
import threading
import unittest
from http.client import HTTPConnection
from unittest.mock import patch

from horizonvigil_runner import server


class ScanAuthorizationTest(unittest.TestCase):
    def test_reference_alone_never_invokes_prowler(self):
        listener = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=listener.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(*listener.server_address, timeout=5)
        try:
            request = json.dumps(dict(provider="aws", tenant_id="t", connection_id="c", credential_ref="grant:test"))
            with patch.dict(server.os.environ, INTERNAL_SCAN_SECRET="fixture"), patch.object(server, "run_scan") as scan:
                connection.request("POST", "/scan", request, {"X-Internal-Scan-Secret": "fixture"})
                response = connection.getresponse()
                self.assertEqual(response.status, 503)
                self.assertEqual(json.loads(response.read())["error"], "credential_broker_unavailable")
                scan.assert_not_called()
        finally:
            connection.close()
            listener.shutdown()
            listener.server_close()
            thread.join()
