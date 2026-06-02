from http.server import BaseHTTPRequestHandler
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _db import get_conn, init_db

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            init_db()
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            target_id = body.get("target_id")
            nuevo_rol = body.get("rol")
            # Validaciones básicas
            if not target_id or nuevo_rol not in ("admin", "usuario"):
                return self._json(400, {"status": "error", "message": "Parámetros inválidos."})
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("UPDATE Usuarios SET rol = %s WHERE id = %s", (nuevo_rol, target_id))
            conn.commit()
            cur.execute(
                "SELECT id, nombres, apellidos, cedula_identidad, correo, usuario, foto_perfil, rol FROM Usuarios WHERE id = %s",
                (target_id,)
            )
            r = cur.fetchone()
            cur.close(); conn.close()
            if not r:
                return self._json(404, {"status": "error", "message": "Usuario no encontrado."})
            user_data = {"id": r[0], "nombres": r[1], "apellidos": r[2],
                         "cedula_identidad": r[3], "correo": r[4], "usuario": r[5],
                         "foto_perfil": r[6], "rol": r[7]}
            self._json(200, {"status": "success", "message": f"Rol actualizado a {nuevo_rol}.", "user": user_data})
        except Exception as e:
            self._json(500, {"status": "error", "message": str(e)})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _json(self, code, data):
        body = json.dumps(data, default=str).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a): pass
