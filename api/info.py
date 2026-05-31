from http.server import BaseHTTPRequestHandler
import json, socket

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # En Vercel no hay IP local — devolvemos el host del request
        host = self.headers.get("host", "")
        scheme = "https" if "vercel.app" in host or "https" in host else "http"
        self._json(200, {"local_ip": host, "base_url": f"{scheme}://{host}"})

    def _json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a): pass
