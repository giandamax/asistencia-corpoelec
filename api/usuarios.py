from http.server import BaseHTTPRequestHandler
from datetime import datetime
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _db import get_conn, hash_password, init_db

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            init_db()
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id, nombres, apellidos, cedula_identidad, correo, usuario, foto_perfil, rol, aprobado FROM Usuarios")
            rows = cur.fetchall()
            data = [{"id": r[0], "nombres": r[1], "apellidos": r[2], "cedula_identidad": r[3],
                     "correo": r[4], "usuario": r[5], "foto_perfil": r[6], "rol": r[7], "aprobado": bool(r[8])} for r in rows]
            cur.close(); conn.close()
            self._json(200, data)
        except Exception as e:
            self._json(500, {"error": str(e)})

    def do_POST(self):
        try:
            init_db()
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            conn = get_conn()
            cur = conn.cursor()
            hashed = hash_password(body["password"])
            cur.execute(
                "INSERT INTO Usuarios (nombres, apellidos, cedula_identidad, correo, usuario, password) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                (body["nombres"], body["apellidos"], body["cedula_identidad"], body["correo"], body["usuario"], hashed)
            )
            user_id = cur.fetchone()[0]
            qr_data = f"USER_{user_id}_{body['cedula_identidad']}"
            cur.execute("INSERT INTO Gestion_QR (usuario_id, qr_code_data, fecha_generacion) VALUES (%s,%s,%s)",
                        (user_id, qr_data, datetime.now()))
            conn.commit(); cur.close(); conn.close()
            self._json(200, {"status": "success", "message": "Usuario creado", "qr_data": qr_data})
        except Exception as e:
            if "unique" in str(e).lower():
                self._json(400, {"status": "error", "message": "Error: Cédula o Usuario ya registrada"})
            else:
                self._json(500, {"status": "error", "message": str(e)})

    def do_DELETE(self):
        try:
            from urllib.parse import urlparse, parse_qs
            params = parse_qs(urlparse(self.path).query)
            uid = params.get("id", [None])[0]
            if not uid:
                return self._json(400, {"status": "error", "message": "ID requerido"})
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("DELETE FROM Gestion_QR WHERE usuario_id = %s", (uid,))
            cur.execute("DELETE FROM Asistencias WHERE usuario_id = %s", (uid,))
            cur.execute("DELETE FROM Usuarios WHERE id = %s", (uid,))
            conn.commit(); cur.close(); conn.close()
            self._json(200, {"status": "success", "message": "Usuario eliminado"})
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
