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
            user_id = body.get("id")
            if not user_id:
                return self._json(400, {"status": "error", "message": "ID de usuario requerido."})
            fields, values = [], []
            for key in ("nombres", "apellidos", "correo", "foto_perfil", "cedula_identidad"):
                if key in body:
                    fields.append(f"{key} = %s")
                    values.append(body[key])
            if body.get("password"):
                fields.append("password = %s")
                values.append(hash_password(body["password"]))
            if not fields:
                return self._json(400, {"status": "error", "message": "No hay campos para actualizar."})
            values.append(user_id)
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f'UPDATE Usuarios SET {", ".join(fields)} WHERE id = %s', values)
            conn.commit()
            cur.execute("SELECT id, nombres, apellidos, cedula_identidad, correo, usuario, foto_perfil FROM Usuarios WHERE id = %s", (user_id,))
            r = cur.fetchone()
            cur.close(); conn.close()
            user_data = {"id": r[0], "nombres": r[1], "apellidos": r[2], "cedula_identidad": r[3],
                         "correo": r[4], "usuario": r[5], "foto_perfil": r[6]}
            self._json(200, {"status": "success", "message": "Perfil actualizado.", "user": user_data})
        except Exception as e:
            self._json(500, {"status": "error", "message": str(e)})

    def _json(self, code, data):
        body = json.dumps(data, default=str).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a): pass
