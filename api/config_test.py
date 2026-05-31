from http.server import BaseHTTPRequestHandler
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _db import get_conn, init_db, send_email_via_gmail

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            init_db()
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            destinatario = body.get("correo", "")
            if not destinatario:
                return self._json(400, {"status": "error", "message": "Correo destinatario requerido"})
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT valor FROM Configuracion WHERE clave = 'email_remitente'")
            rem_row = cur.fetchone()
            cur.execute("SELECT valor FROM Configuracion WHERE clave = 'email_password'")
            pwd_row = cur.fetchone()
            cur.close(); conn.close()
            remitente = body.get("email_remitente") or (rem_row[0] if rem_row else "")
            pwd = body.get("email_password", "")
            if not pwd or pwd == "********":
                pwd = pwd_row[0] if pwd_row else ""
            msg = MIMEMultipart()
            msg["From"] = f"Sistema de Asistencia Corpoelec <{remitente}>"
            msg["To"] = destinatario
            msg["Subject"] = "Correo de Prueba - Sistema de Asistencia Corpoelec"
            msg.attach(MIMEText("<h2>¡Prueba exitosa!</h2><p>Tu servidor SMTP funciona correctamente.</p>", "html"))
            send_email_via_gmail(remitente, pwd, destinatario, msg.as_string())
            self._json(200, {"status": "success", "message": "Correo de prueba enviado exitosamente."})
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
