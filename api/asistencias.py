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
            cur.execute("""
                SELECT u.nombres, u.apellidos, u.cedula_identidad,
                       a.fecha_registro, a.hora_entrada, a.metodo_verificacion
                FROM Asistencias a
                JOIN Usuarios u ON a.usuario_id = u.id
                ORDER BY a.fecha_registro DESC, a.hora_entrada DESC
            """)
            rows = cur.fetchall()
            from _db import format_time_12h
            data = [
                {"nombres": r[0], "apellidos": r[1], "cedula": r[2],
                 "fecha": str(r[3]), "hora": format_time_12h(r[4]), "metodo": r[5]}
                for r in rows
            ]
            cur.close(); conn.close()
            self._json(200, data)
        except Exception as e:
            self._json(500, {"error": str(e)})

    def do_POST(self):
        try:
            init_db()
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            qr_data = body.get("qr_data", "")
            if not qr_data.startswith("USER_"):
                return self._json(400, {"status": "error", "message": "QR Inválido"})
            parts = qr_data.split("_")
            if len(parts) < 3:
                return self._json(400, {"status": "error", "message": "QR Inválido"})
            user_id = parts[1]
            now = datetime.now()
            if now.hour < 8 or now.hour >= 18:
                return self._json(400, {"status": "error", "message": "El registro de asistencia solo está permitido de 8:00 AM a 6:00 PM."})
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT nombres, apellidos, correo FROM Usuarios WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if not user:
                cur.close(); conn.close()
                return self._json(404, {"status": "error", "message": "Usuario no encontrado"})
            cur.execute("SELECT id FROM Asistencias WHERE usuario_id = %s AND fecha_registro = %s",
                        (user_id, now.strftime("%Y-%m-%d")))
            if cur.fetchone():
                cur.close(); conn.close()
                return self._json(400, {"status": "error", "message": f"La asistencia para {user[0]} {user[1]} ya fue registrada hoy."})
            cur.execute("INSERT INTO Asistencias (usuario_id, fecha_registro, hora_entrada, metodo_verificacion) VALUES (%s, %s, %s, %s)",
                        (user_id, now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S"), "Escaneo QR"))
            conn.commit()
            # Enviar correo
            cur.execute("SELECT valor FROM Configuracion WHERE clave = 'email_habilitado'")
            hab = cur.fetchone()
            if hab and hab[0] == "1" and user[2]:
                cur.execute("SELECT valor FROM Configuracion WHERE clave = 'email_remitente'")
                rem = cur.fetchone()[0]
                cur.execute("SELECT valor FROM Configuracion WHERE clave = 'email_password'")
                pwd = cur.fetchone()[0]
                if pwd:
                    try:
                        from email.mime.multipart import MIMEMultipart
                        from email.mime.text import MIMEText
                        from _db import format_time_12h, send_email_via_gmail
                        msg = MIMEMultipart()
                        msg["From"] = f"Sistema de Asistencia Corpoelec <{rem}>"
                        msg["To"] = user[2]
                        msg["Subject"] = f"Registro de Asistencia Exitoso - {now.strftime('%d/%m/%Y')}"
                        html = f"""<html><body style="font-family:Arial,sans-serif;color:#333;">
                        <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px;">
                          <h2 style="color:#b5000b;">Hola, {user[0]} {user[1]}</h2>
                          <p>Tu asistencia fue registrada exitosamente hoy.</p>
                          <table style="width:100%;border-collapse:collapse;margin-top:15px;">
                            <tr style="background:#f7fafc;"><td style="padding:10px;border:1px solid #edf2f7;font-weight:bold;">Fecha:</td><td style="padding:10px;border:1px solid #edf2f7;">{now.strftime('%d/%m/%Y')}</td></tr>
                            <tr><td style="padding:10px;border:1px solid #edf2f7;font-weight:bold;">Hora de Entrada:</td><td style="padding:10px;border:1px solid #edf2f7;">{format_time_12h(now.strftime('%H:%M:%S'))}</td></tr>
                            <tr style="background:#f7fafc;"><td style="padding:10px;border:1px solid #edf2f7;font-weight:bold;">Método:</td><td style="padding:10px;border:1px solid #edf2f7;">Escaneo Código QR</td></tr>
                          </table>
                          <p style="font-size:12px;color:#a0aec0;border-top:1px solid #edf2f7;padding-top:15px;">Este es un correo automático.</p>
                        </div></body></html>"""
                        msg.attach(MIMEText(html, "html"))
                        send_email_via_gmail(rem, pwd, user[2], msg.as_string())
                    except Exception:
                        pass
            cur.close(); conn.close()
            self._json(200, {"status": "success", "message": f"Asistencia registrada: {user[0]} {user[1]}"})
        except Exception as e:
            self._json(500, {"error": str(e)})

    def do_DELETE(self):
        try:
            from urllib.parse import urlparse, parse_qs
            params = parse_qs(urlparse(self.path).query)
            fecha = params.get("fecha", [None])[0]
            conn = get_conn()
            cur = conn.cursor()
            if fecha:
                cur.execute("DELETE FROM Asistencias WHERE fecha_registro = %s", (fecha,))
            else:
                cur.execute("DELETE FROM Asistencias")
            deleted = cur.rowcount
            conn.commit(); cur.close(); conn.close()
            self._json(200, {"status": "success", "message": f"{deleted} registro(s) eliminado(s)."})
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
