import os, sys

# Leer DATABASE_URL del .env.local
db_url = None
try:
    with open('.env.production.local') as f:
        for line in f:
            line = line.strip()
            if line.startswith('DATABASE_URL='):
                db_url = line.split('=', 1)[1].strip().strip('"').strip("'")
                break
except FileNotFoundError:
    print("ERROR: .env.production.local no encontrado")
    sys.exit(1)

if not db_url:
    print("ERROR: DATABASE_URL no encontrada en .env.local")
    sys.exit(1)

import psycopg2

conn = psycopg2.connect(db_url, sslmode='require')
cur = conn.cursor()

# Primero mostrar usuarios actuales
cur.execute("SELECT id, usuario, rol FROM Usuarios ORDER BY id")
rows = cur.fetchall()
print("Usuarios en la BD:")
for r in rows:
    print(f"  ID={r[0]}  usuario={r[1]}  rol={r[2]}")

# Asignar admin a TODOS los usuarios existentes (primera configuración)
cur.execute("UPDATE Usuarios SET rol='admin' WHERE rol IS NULL OR rol='usuario'")
affected = cur.rowcount
conn.commit()

print(f"\n✅ Se asignó rol 'admin' a {affected} usuario(s).")

# Verificar
cur.execute("SELECT id, usuario, rol FROM Usuarios ORDER BY id")
rows = cur.fetchall()
print("\nEstado final:")
for r in rows:
    print(f"  ID={r[0]}  usuario={r[1]}  rol={r[2]}")

cur.close()
conn.close()
