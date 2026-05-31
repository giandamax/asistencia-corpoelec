"""
Módulo compartido: conexión a Neon Postgres para las funciones serverless de Vercel.
"""
import os
import psycopg2
import psycopg2.extras
import hashlib

DATABASE_URL = os.environ.get("DATABASE_URL")


def get_conn():
    """Abre y retorna una conexión a la base de datos Postgres."""
    return psycopg2.connect(DATABASE_URL, sslmode="require")


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def format_time_12h(time_str: str) -> str:
    from datetime import datetime
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            t = datetime.strptime(str(time_str), fmt)
            hour = t.strftime("%I").lstrip("0") or "12"
            return f"{hour}:{t.strftime('%M')} {t.strftime('%p')}"
        except ValueError:
            continue
    return str(time_str)


def init_db():
    """Crea las tablas si no existen (se llama una sola vez al desplegar)."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS Usuarios (
            id SERIAL PRIMARY KEY,
            nombres TEXT,
            apellidos TEXT,
            cedula_identidad TEXT UNIQUE,
            correo TEXT,
            usuario TEXT UNIQUE,
            password TEXT,
            foto_perfil TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS Gestion_QR (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER UNIQUE REFERENCES Usuarios(id),
            qr_code_data TEXT,
            fecha_generacion TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS Asistencias (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER REFERENCES Usuarios(id),
            fecha_registro DATE,
            hora_entrada TIME,
            metodo_verificacion TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS Configuracion (
            clave TEXT PRIMARY KEY,
            valor TEXT
        )
    """)
    cur.execute("INSERT INTO Configuracion (clave, valor) VALUES ('email_habilitado','0') ON CONFLICT DO NOTHING")
    cur.execute("INSERT INTO Configuracion (clave, valor) VALUES ('email_remitente','') ON CONFLICT DO NOTHING")
    cur.execute("INSERT INTO Configuracion (clave, valor) VALUES ('email_password','') ON CONFLICT DO NOTHING")
    conn.commit()
    cur.close()
    conn.close()


def send_email_via_gmail(remitente, password_app, destinatario, msg_string):
    import smtplib
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=10)
        server.starttls()
        server.login(remitente, password_app)
        server.sendmail(remitente, destinatario, msg_string)
        server.quit()
        return True
    except Exception as e587:
        import smtplib as sl
        if isinstance(e587, sl.SMTPAuthenticationError):
            raise e587
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10)
        server.login(remitente, password_app)
        server.sendmail(remitente, destinatario, msg_string)
        server.quit()
        return True
