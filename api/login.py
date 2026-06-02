from http.server import BaseHTTPRequestHandler
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _db import get_conn, hash_password, init_db

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            init_db()
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            usuario = body.get("usuario", "").strip()
            password = body.get("password", "")
            if not usuario or not password:
                return self._json(400, {"status": "error", "message": "Usuario y contraseña requeridos."})
            hashed = hash_password(password)
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "SELECT id, nombres, apellidos, cedula_identidad, correo, usuario, foto_perfil, rol FROM Usuarios WHERE usuario = %s AND password = %s",
                (usuario, hashed)
            )
            row = cur.fetchone()
            cur.close(); conn.close()
            if row:
                user_data = {"id": row[0], "nombres": row[1], "apellidos": row[2],
                             "cedula_identidad": row[3], "correo": row[4], "usuario": row[5],
                             "foto_perfil": row[6], "rol": row[7]}
                self._json(200, {"status": "success", "user": user_data})
            else:
                self._json(401, {"status": "error", "message": "Usuario o contraseña incorrectos."})
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
