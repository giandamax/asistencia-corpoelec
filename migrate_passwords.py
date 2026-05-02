"""
Migración: hashea las contraseñas existentes en texto plano a SHA-256.
Ejecutar UNA SOLA VEZ antes de reiniciar el servidor con el nuevo código.

    python migrate_passwords.py
"""
import sqlite3
import hashlib

DB = 'asistencia.db'

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def is_already_hashed(value: str) -> bool:
    # SHA-256 hex digest siempre tiene exactamente 64 caracteres hexadecimales
    return len(value) == 64 and all(c in '0123456789abcdef' for c in value.lower())

conn = sqlite3.connect(DB)
c = conn.cursor()
c.execute('SELECT id, usuario, password FROM Usuarios')
rows = c.fetchall()

updated = 0
skipped = 0
for user_id, usuario, password in rows:
    if is_already_hashed(password):
        print(f'  [OMITIDO]   {usuario} — ya está hasheado')
        skipped += 1
    else:
        new_hash = hash_password(password)
        c.execute('UPDATE Usuarios SET password = ? WHERE id = ?', (new_hash, user_id))
        print(f'  [MIGRADO]   {usuario} — contraseña hasheada correctamente')
        updated += 1

conn.commit()
conn.close()
print(f'\n✅ Migración completa: {updated} usuario(s) migrado(s), {skipped} omitido(s).')
