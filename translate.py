import os

file_path = 'corpoelec.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'CORPOELEC Digital Attendance - Employees': 'Asistencia Digital CORPOELEC - Empleados',
    'CORPOELEC\n                Digital Attendance': 'Asistencia Digital\n                CORPOELEC',
    '>Overview<': '>Resumen<',
    '>Directory<': '>Directorio<',
    '>Schedules<': '>Horarios<',
    'Attendance\n                    Management': 'Gestión de\n                    Asistencia',
    'Electric\n                    Pulse System': 'Sistema\n                    Pulso Eléctrico',
    '>Dashboard<': '>Panel de Control<',
    '>Employees<': '>Empleados<',
    '>Scanning Terminal<': '>Terminal de Escaneo<',
    '>Reports<': '>Reportes<',
    '\n                    Scan Now\n': '\n                    Escanear Ahora\n',
    '>Help Center<': '>Centro de Ayuda<',
    '>Logout<': '>Cerrar Sesión<',
    'Employee <span class="text-primary-container">Pulse</span> Directory': 'Directorio de <span class="text-primary-container">Empleados</span>',
    'Comprehensive database of Corpoelec\n                        personnel and security identification assets.': 'Base de datos integral del personal de\n                        Corpoelec y credenciales de seguridad.',
    '\n                        Filters\n': '\n                        Filtros\n',
    '\n                        Add Employee\n': '\n                        Añadir Empleado\n',
    'Search by name, cédula, or department...': 'Buscar por nombre, cédula o departamento...',
    'Total\n                            Active Force': 'Fuerza\n                            Activa Total',
    '>\n                        Employee<': '>\n                        Empleado<',
    '>\n                        ID Number<': '>\n                        Cédula<',
    '>\n                        Department<': '>\n                        Departamento<',
    '>Role\n                    <': '>Cargo\n                    <',
    '>\n                        Actions<': '>\n                        Acciones<',
    '>Active Duty<': '>Activo<',
    '>Grid Operations<': '>Operaciones de Red<',
    '>Senior Technician<': '>Técnico Superior<',
    'title="QR Badge"': 'title="Código QR"',
    'title="Edit"': 'title="Editar"',
    'title="Archive"': 'title="Archivar"',
    '>Strategic Planning<': '>Planificación Estratégica<',
    '>Head of Department<': '>Jefe de Departamento<',
    '>Infrastructure<': '>Infraestructura<',
    '>Security Supervisor<': '>Supervisor de Seguridad<',
    '>Customer Relations<': '>Atención al Cliente<',
    '>Representative<': '>Representante<',
    'Showing <span\n                            class="text-on-surface font-black">1-4</span> of 1,248 Personnel': 'Mostrando <span\n                            class="text-on-surface font-black">1-4</span> de 1,248 Empleados',
    'Security Compliance': 'Cumplimiento de Seguridad',
    '98.4% of IDs are currently\n                            synchronized with the central terminal.': 'El 98.4% de las credenciales están\n                            sincronizadas con la terminal central.',
    'VIEW AUDIT LOG': 'VER REGISTRO DE AUDITORÍA',
    'QR Terminal Update\n                        ': 'Actualización de Terminal QR\n                        ',
    'New firmware v2.4 now\n                            available for all biometric scanners.': 'Nuevo firmware v2.4\n                            disponible para escáneres.',
    'Ensure all terminals are connected to the\n                            Electric Pulse cloud for real-time synchronization.': 'Asegure que las terminales estén conectadas a la\n                            nube para sincronización.',
    '>Register Personnel<': '>Registrar Personal<',
    'Add a new worker to the Electric Pulse system.\n                    ': 'Agregue un nuevo trabajador al sistema.\n                    ',
    'Full\n                            Name': 'Nombre\n                            Completo',
    'Ex: Juan Pérez': 'Ej: Juan Pérez',
    'Cédula\n                            (ID)': 'Cédula\n                            (ID)',
    '>Cancel<': '>Cancelar<',
    '>Register Employee<': '>Registrar Empleado<'
}

for old_text, new_text in replacements.items():
    content = content.replace(old_text, new_text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Translation complete.")
