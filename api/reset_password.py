"""
/api/reset_password  — Recuperación de contraseña
POST {"email": "..."}                         → genera token y envía correo
POST {"token": "...", "new_password": "..."}  → valida token y actualiza password
"""
import json
import secrets
import os
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from http.server import BaseHTTPRequestHandler

from _db import get_conn, hash_password, init_db, send_email_via_gmail

BASE_URL = os.environ.get("VERCEL_URL", "corpoelec-asistencia.vercel.app")


def _json(handler, code, data):
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    handler.send_response(code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(body)


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            init_db()
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")

            # ── Caso 1: solicitar reset por correo ───────────────────────────
            if "email" in body and "token" not in body:
                email = body["email"].strip().lower()
                conn = get_conn()
                cur = conn.cursor()
                cur.execute(
                    'SELECT id, nombres FROM Usuarios WHERE LOWER(correo)=%s', (email,)
                )
                row = cur.fetchone()
                if not row:
                    # Respuesta genérica para no revelar si el correo existe
                    cur.close(); conn.close()
                    return _json(self, 200, {"message": "Si el correo existe, recibirás un enlace."})

                user_id, nombres = row
                token = secrets.token_urlsafe(32)
                expires = datetime.utcnow() + timedelta(hours=1)

                # Invalidar tokens anteriores del mismo usuario
                cur.execute("DELETE FROM reset_tokens WHERE usuario_id=%s", (user_id,))
                cur.execute(
                    "INSERT INTO reset_tokens (usuario_id, token, expires_at) VALUES (%s,%s,%s)",
                    (user_id, token, expires)
                )
                conn.commit()

                # Leer config SMTP
                cur.execute("SELECT clave, valor FROM Configuracion")
                cfg = dict(cur.fetchall())
                cur.close(); conn.close()

                remitente = cfg.get("email_remitente", "")
                pwd_app   = cfg.get("email_password", "")

                reset_url = f"https://{BASE_URL}/reset-password?token={token}"

                if remitente and pwd_app:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = "Recuperación de contraseña — CORPOELEC"
                    msg["From"]    = remitente
                    msg["To"]      = email
                    html = f"""
                    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f9f9f9;padding:32px;border-radius:12px">
                      <h2 style="color:#b5000b;margin-bottom:4px">CORPOELEC</h2>
                      <h3 style="color:#1a1a1a">Restablecer tu contraseña</h3>
                      <p>Hola <strong>{nombres}</strong>,</p>
                      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.<br>
                         Este enlace expira en <strong>1 hora</strong>.</p>
                      <a href="{reset_url}"
                         style="display:inline-block;margin:20px 0;padding:14px 28px;background:#b5000b;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
                        Restablecer contraseña
                      </a>
                      <p style="color:#666;font-size:13px">Si no solicitaste esto, ignora este correo.<br>
                         O copia y pega este enlace: <br><a href="{reset_url}">{reset_url}</a></p>
                    </div>"""
                    msg.attach(MIMEText(html, "html"))
                    try:
                        send_email_via_gmail(remitente, pwd_app, email, msg.as_string())
                    except Exception:
                        pass  # No revelar errores SMTP al cliente

                return _json(self, 200, {"message": "Si el correo existe, recibirás un enlace en los próximos minutos."})

            # ── Caso 2: cambiar contraseña con token ─────────────────────────
            elif "token" in body and "new_password" in body:
                token       = body["token"].strip()
                new_pass    = body["new_password"]

                if len(new_pass) < 6:
                    return _json(self, 400, {"message": "La contraseña debe tener al menos 6 caracteres."})

                conn = get_conn()
                cur = conn.cursor()
                cur.execute(
                    "SELECT usuario_id, expires_at, used FROM reset_tokens WHERE token=%s",
                    (token,)
                )
                row = cur.fetchone()
                if not row:
                    cur.close(); conn.close()
                    return _json(self, 400, {"message": "Enlace inválido o expirado."})

                user_id, expires_at, used = row
                if used or datetime.utcnow() > expires_at:
                    cur.close(); conn.close()
                    return _json(self, 400, {"message": "El enlace ya fue usado o expiró. Solicita uno nuevo."})

                hashed = hash_password(new_pass)
                cur.execute("UPDATE Usuarios SET password=%s WHERE id=%s", (hashed, user_id))
                cur.execute("UPDATE reset_tokens SET used=TRUE WHERE token=%s", (token,))
                conn.commit()
                cur.close(); conn.close()
                return _json(self, 200, {"message": "¡Contraseña actualizada! Ya puedes iniciar sesión."})

            else:
                return _json(self, 400, {"message": "Parámetros inválidos."})

        except Exception as e:
            return _json(self, 500, {"message": str(e)})

    def log_message(self, *args):
        pass
