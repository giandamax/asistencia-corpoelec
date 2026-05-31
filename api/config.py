from http.server import BaseHTTPRequestHandler
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _db import get_conn, init_db

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            init_db()
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT clave, valor FROM Configuracion")
            config = {r[0]: r[1] for r in cur.fetchall()}
            cur.close(); conn.close()
            config["email_habilitado"] = config.get("email_habilitado") == "1"
            if config.get("email_password"):
                config["email_password"] = "********"
            self._json(200, config)
        except Exception as e:
            self._json(500, {"error": str(e)})

    def do_POST(self):
        try:
            init_db()
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            conn = get_conn()
            cur = conn.cursor()
            if "email_habilitado" in body:
                cur.execute("UPDATE Configuracion SET valor = %s WHERE clave = 'email_habilitado'",
                            ("1" if body["email_habilitado"] else "0",))
            if "email_remitente" in body:
                cur.execute("UPDATE Configuracion SET valor = %s WHERE clave = 'email_remitente'", (body["email_remitente"],))
            if "email_password" in body and body["email_password"] != "********":
                cur.execute("UPDATE Configuracion SET valor = %s WHERE clave = 'email_password'", (body["email_password"],))
            conn.commit(); cur.close(); conn.close()
            self._json(200, {"status": "success", "message": "Configuración guardada exitosamente"})
        except Exception as e:
            self._json(500, {"status": "error", "message": str(e)})

    def _json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a): pass
