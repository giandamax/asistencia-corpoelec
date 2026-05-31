import http.server
import socketserver
import sqlite3
import json
import os
import hashlib
from datetime import datetime
from urllib.parse import urlparse, parse_qs

def hash_password(password: str) -> str:
    """Return SHA-256 hex digest of the given password."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def format_time_12h(time_str: str) -> str:
    """Convierte una hora en formato de 24 horas (HH:MM:SS o HH:MM) al formato normal de 12 horas (ej. 3:47 PM)."""
    try:
        t = datetime.strptime(time_str, "%H:%M:%S")
    except ValueError:
        try:
            t = datetime.strptime(time_str, "%H:%M")
        except ValueError:
            return time_str
    
    hour = t.strftime("%I").lstrip("0")
    if not hour:
        hour = "12"
    return f"{hour}:{t.strftime('%M')} {t.strftime('%p')}"

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def get_friendly_smtp_error(e: Exception) -> str:
    err_str = str(e)
    if isinstance(e, smtplib.SMTPAuthenticationError) or "535" in err_str or "accepted" in err_str.lower():
        return (
            "Error de autenticación: El usuario o la contraseña de Gmail fueron rechazados. "
            "Por seguridad, Google requiere que uses una 'Contraseña de Aplicación' de 16 caracteres "
            "generada en la configuración de tu cuenta Google, en lugar de tu contraseña personal normal."
        )
    elif "timeout" in err_str.lower() or "timed out" in err_str.lower():
        return (
            "Tiempo de espera agotado al conectar al servidor de Gmail (smtp.gmail.com). "
            "Esto puede deberse a que tu proveedor de internet o firewall bloquea los puertos SMTP estándar (587 o 465)."
        )
    elif "connection refused" in err_str.lower() or "refused" in err_str.lower():
        return "Conexión rechazada por el servidor SMTP. Verifica tu conexión de red o configuraciones de firewall."
    else:
        return f"Error en conexión SMTP: {err_str}"

def send_email_via_gmail(remitente: str, password_app: str, destinatario: str, msg_string: str) -> bool:
    """Intenta enviar un correo usando Gmail SMTP en puerto 587 (TLS), con fallback a puerto 465 (SSL) si falla."""
    import smtplib
    # Intentar primero por puerto 587 (TLS)
    try:
        print(f"Intentando enviar correo a {destinatario} por smtp.gmail.com:587 (STARTTLS)...")
        server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
        server.starttls()
        server.login(remitente, password_app)
        server.sendmail(remitente, destinatario, msg_string)
        server.quit()
        print("Correo enviado exitosamente por el puerto 587.")
        return True
    except Exception as e587:
        print(f"Fallo al enviar por puerto 587: {e587}")
        # Si es un error de autenticación (credenciales incorrectas), no tiene sentido reintentar en el otro puerto
        if isinstance(e587, smtplib.SMTPAuthenticationError) or "535" in str(e587) or "accepted" in str(e587).lower():
            raise e587
            
        # Intentar fallback por puerto 465 (SSL)
        try:
            print(f"Intentando fallback a {destinatario} por smtp.gmail.com:465 (SSL)...")
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10)
            server.login(remitente, password_app)
            server.sendmail(remitente, destinatario, msg_string)
            server.quit()
            print("Correo enviado exitosamente por el puerto 465 (SSL).")
            return True
        except Exception as e465:
            print(f"Fallo al enviar por puerto 465 (SSL): {e465}")
            # Si es un error de autenticación, lo lanzamos
            if isinstance(e465, smtplib.SMTPAuthenticationError) or "535" in str(e465) or "accepted" in str(e465).lower():
                raise e465
            # De lo contrario, levantamos una excepción general reportando ambos fallos
            raise Exception(f"No se pudo conectar con smtp.gmail.com. Puerto 587: {e587}. Puerto 465: {e465}")

PORT = 8000

# Inicialización de la Base de Datos
def init_db():
    conn = sqlite3.connect('asistencia.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS Usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombres TEXT,
            apellidos TEXT,
            cedula_identidad TEXT UNIQUE,
            correo TEXT,
            usuario TEXT UNIQUE,
            password TEXT,
            foto_perfil TEXT
        )
    ''')
    # Migración: agregar foto_perfil si no existe en versiones previas de la DB
    try:
        c.execute('ALTER TABLE Usuarios ADD COLUMN foto_perfil TEXT')
    except Exception:
        pass  # La columna ya existe
    c.execute('''
        CREATE TABLE IF NOT EXISTS Gestion_QR (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER UNIQUE,
            qr_code_data TEXT,
            fecha_generacion DATETIME,
            FOREIGN KEY(usuario_id) REFERENCES Usuarios(id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS Asistencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            fecha_registro DATE,
            hora_entrada TIME,
            metodo_verificacion TEXT,
            FOREIGN KEY(usuario_id) REFERENCES Usuarios(id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS Configuracion (
            clave TEXT PRIMARY KEY,
            valor TEXT
        )
    ''')
    # Insertar valores por defecto para la configuración de correo si no existen
    c.execute("INSERT OR IGNORE INTO Configuracion (clave, valor) VALUES ('email_habilitado', '0')")
    c.execute("INSERT OR IGNORE INTO Configuracion (clave, valor) VALUES ('email_remitente', 'corpoelec.asistencia.sistema@gmail.com')")
    c.execute("INSERT OR IGNORE INTO Configuracion (clave, valor) VALUES ('email_password', '')")
    conn.commit()
    conn.close()

import socket

def get_local_ip() -> str:
    """Intenta conseguir la dirección IP local del servidor en la red."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # No realiza una conexión real, solo abre el socket local hacia una IP externa para resolver la interfaz activa
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/api/info':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            info = {'local_ip': get_local_ip()}
            self.wfile.write(json.dumps(info).encode('utf-8'))
        elif parsed_path.path == '/api/usuarios':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            c.execute('SELECT id, nombres, apellidos, cedula_identidad, correo, usuario, foto_perfil FROM Usuarios')
            usuarios = [{'id': row[0], 'nombres': row[1], 'apellidos': row[2], 'cedula_identidad': row[3], 'correo': row[4], 'usuario': row[5], 'foto_perfil': row[6]} for row in c.fetchall()]
            conn.close()
            self.wfile.write(json.dumps(usuarios).encode('utf-8'))
        elif parsed_path.path == '/api/asistencias':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            query = '''
                SELECT u.nombres, u.apellidos, u.cedula_identidad, a.fecha_registro, a.hora_entrada, a.metodo_verificacion
                FROM Asistencias a
                JOIN Usuarios u ON a.usuario_id = u.id
                ORDER BY a.fecha_registro DESC, a.hora_entrada DESC
            '''
            c.execute(query)
            asistencias = [{'nombres': row[0], 'apellidos': row[1], 'cedula': row[2], 'fecha': row[3], 'hora': format_time_12h(row[4]), 'metodo': row[5]} for row in c.fetchall()]
            conn.close()
            self.wfile.write(json.dumps(asistencias).encode('utf-8'))
        elif parsed_path.path == '/api/config':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            c.execute('SELECT clave, valor FROM Configuracion')
            config = {row[0]: row[1] for row in c.fetchall()}
            conn.close()
            
            # Formatear el estado de habilitación a booleano
            config['email_habilitado'] = config.get('email_habilitado') == '1'
            # Enmascarar contraseña para seguridad en el frontend
            if 'email_password' in config and config['email_password']:
                config['email_password'] = '********'
            self.wfile.write(json.dumps(config).encode('utf-8'))
        else:
            # Ruta GET no reconocida — devolver 404 JSON limpio
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'error', 'message': 'Ruta no encontrada.'}).encode('utf-8'))

    def do_POST(self):
        if self.path == '/api/usuarios':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            try:
                hashed = hash_password(data['password'])
                c.execute('INSERT INTO Usuarios (nombres, apellidos, cedula_identidad, correo, usuario, password) VALUES (?, ?, ?, ?, ?, ?)', 
                          (data['nombres'], data['apellidos'], data['cedula_identidad'], data['correo'], data['usuario'], hashed))
                user_id = c.lastrowid
                
                qr_data = f"USER_{user_id}_{data['cedula_identidad']}"
                c.execute('INSERT INTO Gestion_QR (usuario_id, qr_code_data, fecha_generacion) VALUES (?, ?, ?)',
                          (user_id, qr_data, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
                
                conn.commit()
                response = {'status': 'success', 'message': 'Usuario creado exitosamente', 'qr_data': qr_data}
                status_code = 200
            except sqlite3.IntegrityError:
                response = {'status': 'error', 'message': 'Error: Cédula o Usuario ya registrada'}
                status_code = 400
            finally:
                conn.close()
                
            self.send_response(status_code)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        elif self.path == '/api/login':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            usuario = data.get('usuario', '').strip()
            password = data.get('password', '')

            if not usuario or not password:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'Usuario y contraseña son requeridos.'}).encode('utf-8'))
                return

            hashed = hash_password(password)
            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            c.execute(
                'SELECT id, nombres, apellidos, cedula_identidad, correo, usuario, foto_perfil FROM Usuarios WHERE usuario = ? AND password = ?',
                (usuario, hashed)
            )
            row = c.fetchone()
            conn.close()

            if row:
                user_data = {
                    'id': row[0], 'nombres': row[1], 'apellidos': row[2],
                    'cedula_identidad': row[3], 'correo': row[4], 'usuario': row[5],
                    'foto_perfil': row[6]
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success', 'user': user_data}).encode('utf-8'))
            else:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'Usuario o contraseña incorrectos.'}).encode('utf-8'))
            return

        elif self.path == '/api/asistencias':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            qr_data = data.get('qr_data', '')
            if not qr_data.startswith('USER_'):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'QR Inválido'}).encode('utf-8'))
                return
                
            parts = qr_data.split('_')
            if len(parts) < 3:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'QR Inválido'}).encode('utf-8'))
                return
                
            user_id = parts[1]
            
            # Verificar que la hora actual esté en el rango de 8:00 AM a 6:00 PM
            now = datetime.now()
            if now.hour < 8 or now.hour >= 18:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'error',
                    'message': 'El registro de asistencia no está permitido en este horario. Debe realizarse de 8:00 AM a 6:00 PM.'
                }).encode('utf-8'))
                return
            
            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            
            # Check if user exists
            c.execute('SELECT nombres, apellidos, correo FROM Usuarios WHERE id = ?', (user_id,))
            user = c.fetchone()
            
            if user:
                # Check if already scanned today
                now = datetime.now()
                c.execute('SELECT id FROM Asistencias WHERE usuario_id = ? AND fecha_registro = ?', (user_id, now.strftime("%Y-%m-%d")))
                existing = c.fetchone()
                
                if existing:
                    response = {'status': 'error', 'message': f'La asistencia para {user[0]} {user[1]} ya fue registrada hoy.'}
                    self.send_response(400)
                else:
                    c.execute('INSERT INTO Asistencias (usuario_id, fecha_registro, hora_entrada, metodo_verificacion) VALUES (?, ?, ?, ?)',
                              (user_id, now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S"), "Escaneo QR"))
                    conn.commit()
                    response = {'status': 'success', 'message': f'Asistencia registrada correctamente: {user[0]} {user[1]}'}
                    self.send_response(200)
                             # Enviar correo electrónico de confirmación
                    destinatario = user[2]
                    if destinatario:
                        # Leer configuración de correo de la base de datos
                        c.execute("SELECT valor FROM Configuracion WHERE clave = 'email_habilitado'")
                        row_hab = c.fetchone()
                        email_habilitado = row_hab[0] == '1' if row_hab else False
                        
                        if email_habilitado:
                            c.execute("SELECT valor FROM Configuracion WHERE clave = 'email_remitente'")
                            row_rem = c.fetchone()
                            remitente = row_rem[0] if row_rem else 'corpoelec.asistencia.sistema@gmail.com'
                            
                            c.execute("SELECT valor FROM Configuracion WHERE clave = 'email_password'")
                            row_pwd = c.fetchone()
                            password_app = row_pwd[0] if row_pwd else ''
                            
                            if password_app:
                                try:
                                    msg = MIMEMultipart()
                                    msg['From'] = f"Sistema de Asistencia Corpoelec <{remitente}>"
                                    msg['To'] = destinatario
                                    msg['Subject'] = f"Registro de Asistencia Exitoso - {now.strftime('%d/%m/%Y')}"
                                    
                                    html = f"""
                                    <html>
                                      <body style="font-family: Arial, sans-serif; color: #333;">
                                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                                          <h2 style="color: #dd6b20;">Hola, {user[0]} {user[1]}</h2>
                                          <p>Te informamos que se ha registrado tu asistencia el día de hoy en el sistema de Corpoelec.</p>
                                          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                                            <tr style="background-color: #f7fafc;">
                                              <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold;">Fecha:</td>
                                              <td style="padding: 10px; border: 1px solid #edf2f7;">{now.strftime('%d/%m/%Y')}</td>
                                            </tr>
                                            <tr>
                                              <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold;">Hora de Entrada:</td>
                                              <td style="padding: 10px; border: 1px solid #edf2f7;">{format_time_12h(now.strftime('%H:%M:%S'))}</td>
                                            </tr>
                                            <tr style="background-color: #f7fafc;">
                                              <td style="padding: 10px; border: 1px solid #edf2f7; font-weight: bold;">Método:</td>
                                              <td style="padding: 10px; border: 1px solid #edf2f7;">Escaneo Código QR</td>
                                            </tr>
                                          </table>
                                          <br>
                                          <p style="font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 15px;">
                                            Este es un correo automático. Por favor, no respondas a este mensaje.
                                          </p>
                                        </div>
                                      </body>
                                    </html>
                                    """
                                    msg.attach(MIMEText(html, 'html'))
                                    
                                    send_email_via_gmail(remitente, password_app, destinatario, msg.as_string())
                                except Exception as e:
                                    friendly_err = get_friendly_smtp_error(e)
                                    print(f"Error al enviar correo de asistencia a {destinatario}: {friendly_err}")
                            else:
                                print("Envío de correo omitido: La contraseña de aplicación está vacía.")
                        else:
                            print("Envío de correo omitido: El servicio de notificaciones está deshabilitado.")
            else:
                response = {'status': 'error', 'message': 'Usuario no encontrado en la base de datos'}
                self.send_response(404)
                
            conn.close()
            
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        elif self.path == '/api/config':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            try:
                if 'email_habilitado' in data:
                    val = '1' if data['email_habilitado'] else '0'
                    c.execute("UPDATE Configuracion SET valor = ? WHERE clave = 'email_habilitado'", (val,))
                if 'email_remitente' in data:
                    c.execute("UPDATE Configuracion SET valor = ? WHERE clave = 'email_remitente'", (data['email_remitente'],))
                if 'email_password' in data and data['email_password'] != '********':
                    c.execute("UPDATE Configuracion SET valor = ? WHERE clave = 'email_password'", (data['email_password'],))
                conn.commit()
                response = {'status': 'success', 'message': 'Configuración guardada exitosamente'}
                status_code = 200
            except Exception as e:
                response = {'status': 'error', 'message': str(e)}
                status_code = 500
            finally:
                conn.close()
                
            self.send_response(status_code)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        elif self.path == '/api/config/test':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            destinatario = data.get('correo', '')
            if not destinatario:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'Correo destinatario requerido'}).encode('utf-8'))
                return
                
            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            c.execute("SELECT valor FROM Configuracion WHERE clave = 'email_remitente'")
            remitente = c.fetchone()[0]
            c.execute("SELECT valor FROM Configuracion WHERE clave = 'email_password'")
            pwd_raw = c.fetchone()[0]
            conn.close()
            
            pwd_to_use = data.get('email_password', '')
            if pwd_to_use == '********' or not pwd_to_use:
                pwd_to_use = pwd_raw
                
            remitente_to_use = data.get('email_remitente', '')
            if not remitente_to_use:
                remitente_to_use = remitente
                
            try:
                msg = MIMEMultipart()
                msg['From'] = f"Sistema de Asistencia Corpoelec <{remitente_to_use}>"
                msg['To'] = destinatario
                msg['Subject'] = "Correo de Prueba - Sistema de Asistencia Corpoelec"
                
                html = """
                <html>
                  <body style="font-family: Arial, sans-serif; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                      <h2 style="color: #002b67;">¡Prueba de Conexión Exitosa!</h2>
                      <p>Este es un correo de prueba enviado desde el Sistema de Asistencia de Corpoelec.</p>
                      <p>Si has recibido este mensaje, significa que la configuración del servidor de correo (SMTP) funciona correctamente.</p>
                      <br>
                      <p style="font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 15px;">
                        Este es un correo de prueba automático.
                      </p>
                    </div>
                  </body>
                </html>
                """
                msg.attach(MIMEText(html, 'html'))
                
                send_email_via_gmail(remitente_to_use, pwd_to_use, destinatario, msg.as_string())
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success', 'message': 'Correo de prueba enviado exitosamente.'}).encode('utf-8'))
            except Exception as e:
                import traceback
                traceback.print_exc()
                friendly_message = get_friendly_smtp_error(e)
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': friendly_message}).encode('utf-8'))
        elif self.path == '/api/perfil':
            # Endpoint para actualizar perfil del usuario (nombres, apellidos, correo, foto, password)
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            user_id = data.get('id')
            if not user_id:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'ID de usuario requerido.'}).encode('utf-8'))
                return

            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            try:
                fields = []
                values = []
                if 'nombres' in data:
                    fields.append('nombres = ?')
                    values.append(data['nombres'])
                if 'apellidos' in data:
                    fields.append('apellidos = ?')
                    values.append(data['apellidos'])
                if 'correo' in data:
                    fields.append('correo = ?')
                    values.append(data['correo'])
                if 'foto_perfil' in data:
                    fields.append('foto_perfil = ?')
                    values.append(data['foto_perfil'])
                if 'password' in data and data['password']:
                    fields.append('password = ?')
                    values.append(hash_password(data['password']))

                if not fields:
                    response = {'status': 'error', 'message': 'No hay campos para actualizar.'}
                    status_code = 400
                else:
                    values.append(user_id)
                    c.execute(f'UPDATE Usuarios SET {", ".join(fields)} WHERE id = ?', values)
                    conn.commit()
                    # Devolver datos actualizados del usuario
                    c.execute('SELECT id, nombres, apellidos, cedula_identidad, correo, usuario, foto_perfil FROM Usuarios WHERE id = ?', (user_id,))
                    row = c.fetchone()
                    user_data = {
                        'id': row[0], 'nombres': row[1], 'apellidos': row[2],
                        'cedula_identidad': row[3], 'correo': row[4], 'usuario': row[5],
                        'foto_perfil': row[6]
                    }
                    response = {'status': 'success', 'message': 'Perfil actualizado correctamente.', 'user': user_data}
                    status_code = 200
            except Exception as e:
                response = {'status': 'error', 'message': str(e)}
                status_code = 500
            finally:
                conn.close()

            self.send_response(status_code)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            # Ruta POST desconocida — evita que el navegador quede colgado
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'error', 'message': 'Ruta no encontrada.'}).encode('utf-8'))

    def do_DELETE(self):
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/api/usuarios':
            params = parse_qs(parsed_path.query)
            user_id = params.get('id', [None])[0]

            if not user_id:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'ID de usuario requerido'}).encode('utf-8'))
                return

            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            try:
                c.execute('DELETE FROM Asistencias WHERE usuario_id = ?', (user_id,))
                c.execute('DELETE FROM Gestion_QR WHERE usuario_id = ?', (user_id,))
                c.execute('DELETE FROM Usuarios WHERE id = ?', (user_id,))
                deleted = c.rowcount
                conn.commit()
                if deleted:
                    response = {'status': 'success', 'message': 'Usuario eliminado correctamente'}
                    status_code = 200
                else:
                    response = {'status': 'error', 'message': 'Usuario no encontrado'}
                    status_code = 404
            except Exception as e:
                response = {'status': 'error', 'message': str(e)}
                status_code = 500
            finally:
                conn.close()

            self.send_response(status_code)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))

        elif parsed_path.path == '/api/asistencias':
            params = parse_qs(parsed_path.query)
            fecha = params.get('fecha', [None])[0]

            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            try:
                if fecha:
                    c.execute('DELETE FROM Asistencias WHERE fecha_registro = ?', (fecha,))
                else:
                    c.execute('DELETE FROM Asistencias')
                deleted = c.rowcount
                conn.commit()
                response = {'status': 'success', 'message': f'{deleted} registro(s) eliminado(s).'}
                status_code = 200
            except Exception as e:
                response = {'status': 'error', 'message': str(e)}
                status_code = 500
            finally:
                conn.close()

            self.send_response(status_code)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        """Override para suprimir los logs del servidor HTTP por defecto."""
        pass

if __name__ == '__main__':
    init_db()
    with http.server.ThreadingHTTPServer(("", PORT), Handler) as httpd:
        print(f"Servidor Corpoelec Asistencia corriendo en http://localhost:{PORT}")
        httpd.serve_forever()
