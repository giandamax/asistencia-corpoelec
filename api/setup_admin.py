"""
Endpoint temporal de setup inicial: asigna rol 'admin' a todos los usuarios existentes.
ELIMINAR después del primer uso.
"""
from http.server import BaseHTTPRequestHandler
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _db import get_conn, init_db

SECRET = "corpoelec-setup-2024"

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        key = qs.get("key", [""])[0]
        if key != SECRET:
            return self._json(403, {"error": "Acceso denegado."})
        try:
            init_db()
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS rol TEXT NOT NULL DEFAULT 'usuario'")
            cur.execute("UPDATE Usuarios SET rol='admin' WHERE rol IS NULL OR rol='usuario'")
            affected = cur.rowcount
            conn.commit()
            cur.execute("SELECT id, usuario, rol FROM Usuarios ORDER BY id")
            rows = cur.fetchall()
            cur.close(); conn.close()
            users = [{"id": r[0], "usuario": r[1], "rol": r[2]} for r in rows]
            self._json(200, {
                "status": "ok",
                "message": f"{affected} usuario(s) promovidos a admin.",
                "usuarios": users
            })
        except Exception as e:
            self._json(500, {"error": str(e)})

    def _json(self, code, data):
        body = json.dumps(data, default=str).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a): pass
