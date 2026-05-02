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
            password TEXT
        )
    ''')
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
    conn.commit()
    conn.close()

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path == '/api/usuarios':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            c.execute('SELECT id, nombres, apellidos, cedula_identidad, correo, usuario FROM Usuarios')
            usuarios = [{'id': row[0], 'nombres': row[1], 'apellidos': row[2], 'cedula_identidad': row[3], 'correo': row[4], 'usuario': row[5]} for row in c.fetchall()]
            conn.close()
            self.wfile.write(json.dumps(usuarios).encode('utf-8'))

        elif path == '/api/asistencias':
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
            asistencias = [{'nombres': row[0], 'apellidos': row[1], 'cedula': row[2], 'fecha': row[3], 'hora': row[4], 'metodo': row[5]} for row in c.fetchall()]
            conn.close()
            self.wfile.write(json.dumps(asistencias).encode('utf-8'))

        else:
            # Archivos estáticos desde dist/ o SPA routing
            _, ext = os.path.splitext(path)
            if ext:
                # Tiene extensión (.js, .css, .png, etc.) → servir desde dist/
                self.path = '/dist' + self.path
            else:
                # Ruta de React (/, /login, /dashboard, /reportes, etc.) → SPA
                self.path = '/dist/index.html'
            super().do_GET()

    def log_message(self, format, *args):
        # Suprimir logs verbosos de archivos estáticos
        if not any(ext in args[0] for ext in ['.js', '.css', '.png', '.ico', '.svg', '.woff']):
            super().log_message(format, *args)

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
                'SELECT id, nombres, apellidos, cedula_identidad, correo, usuario FROM Usuarios WHERE usuario = ? AND password = ?',
                (usuario, hashed)
            )
            row = c.fetchone()
            conn.close()

            if row:
                user_data = {
                    'id': row[0], 'nombres': row[1], 'apellidos': row[2],
                    'cedula_identidad': row[3], 'correo': row[4], 'usuario': row[5]
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
            
            conn = sqlite3.connect('asistencia.db')
            c = conn.cursor()
            
            # Check if user exists
            c.execute('SELECT nombres, apellidos FROM Usuarios WHERE id = ?', (user_id,))
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
            else:
                response = {'status': 'error', 'message': 'Usuario no encontrado en la base de datos'}
                self.send_response(404)
                
            conn.close()
            
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

if __name__ == '__main__':
    init_db()
    # Para permitir reusar la dirección si se reinicia rápido
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Servidor Corpoelec Asistencia corriendo en http://localhost:{PORT}")
        httpd.serve_forever()
