html_content = """<!DOCTYPE html>
<html class="light" lang="es">

<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Asistencia Digital CORPOELEC - Empleados</title>
    
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    
    <!-- QR Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>

    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "secondary-container": "#9fc2fe",
                        "on-background": "#191c1d",
                        "on-secondary-fixed": "#001b3c",
                        "on-secondary-fixed-variant": "#1f477b",
                        "on-secondary-container": "#294f83",
                        "on-tertiary": "#ffffff",
                        "on-surface": "#191c1d",
                        "surface-container-lowest": "#ffffff",
                        "primary": "#b5000b",
                        "tertiary-container": "#5f747f",
                        "on-tertiary-container": "#edf8ff",
                        "on-tertiary-fixed": "#071e27",
                        "on-error": "#ffffff",
                        "inverse-primary": "#ffb4aa",
                        "on-primary": "#ffffff",
                        "surface-dim": "#d9dadb",
                        "secondary-fixed": "#d5e3ff",
                        "tertiary-fixed": "#cfe6f2",
                        "secondary-fixed-dim": "#a7c8ff",
                        "on-surface-variant": "#5e3f3b",
                        "secondary": "#3a5f94",
                        "tertiary-fixed-dim": "#b4cad6",
                        "primary-fixed": "#ffdad5",
                        "on-secondary": "#ffffff",
                        "surface-container-highest": "#e1e3e4",
                        "error": "#ba1a1a",
                        "on-primary-fixed-variant": "#930007",
                        "primary-fixed-dim": "#ffb4aa",
                        "primary-container": "#e30613",
                        "surface": "#f8f9fa",
                        "surface-tint": "#c0000c",
                        "surface-container": "#edeeef",
                        "surface-bright": "#f8f9fa",
                        "on-error-container": "#93000a",
                        "on-tertiary-fixed-variant": "#354a53",
                        "surface-variant": "#e1e3e4",
                        "tertiary": "#475c66",
                        "surface-container-low": "#f3f4f5",
                        "inverse-on-surface": "#f0f1f2",
                        "error-container": "#ffdad6",
                        "on-primary-fixed": "#410001",
                        "inverse-surface": "#2e3132",
                        "outline": "#936e69",
                        "on-primary-container": "#fff5f3",
                        "background": "#f8f9fa",
                        "outline-variant": "#e9bcb6",
                        "surface-container-high": "#e7e8e9"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "fontFamily": {
                        "headline": ["Public Sans"],
                        "body": ["Inter"],
                        "label": ["Inter"]
                    }
                },
            },
        }
    </script>
    <style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body { font-family: 'Inter', sans-serif; background-color: #f8f9fa; }
        .headline-font { font-family: 'Public Sans', sans-serif; }
        
        /* Views System */
        .view { display: none; animation: fadeIn 0.3s ease; }
        .view.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Alert System */
        #alert-container { position: fixed; top: 80px; right: 20px; z-index: 1000; display: flex; flex-direction: column; gap: 10px;}
        .alert { padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); color: white; font-weight: bold; }
        .alert.success { background-color: #2e7d32; }
        .alert.error { background-color: #c62828; }
        
        /* Modals */
        .modal { display: none; }
        .modal.active { display: flex; animation: fadeIn 0.3s ease;}
    </style>
</head>

<body class="text-on-background">
    <!-- TopNavBar -->
    <header class="fixed top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(181,0,11,0.04)] flex justify-between items-center px-8 py-4">
        <div class="flex items-center gap-4">
            <span class="text-xl font-black text-red-600 dark:text-red-500 tracking-tighter headline-font">Asistencia Digital CORPOELEC</span>
        </div>
        <div class="flex items-center gap-6">
            <div class="flex items-center gap-4 border-l pl-6 border-slate-200/50">
                <button class="material-symbols-outlined text-tertiary hover:text-primary transition-colors">notifications</button>
                <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-surface-container-highest">
                    <img alt="User profile avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDq4srDC27whZiuA1G4JswunDgCtHh-Wi9v00g_8YOsgbohKEyw9wmUJ4Q1vfbBxLtsCu4RNu6qx4yv2uxB55t7zGt6-KI923yPqaYAmFpnQUqwDr-ysJamrPuVTwHSy7_ZMrfWE11jrC0BCwgOT6SAtxHXHut4E1uSNf-vzb2yjlnUogDOzCxc2hQr6eL_zAg_Kg3KR2we2nlA3JJne9-2eQhGR2uHdsF01PTHanlyu6-C8qyFV9sV9-RwbVwFwXw1fx0kTT6Dfc" />
                </div>
            </div>
        </div>
    </header>

    <div class="flex pt-20">
        <!-- SideNavBar -->
        <aside class="fixed left-0 top-0 h-screen w-64 flex flex-col py-8 gap-6 bg-slate-50 dark:bg-slate-950 border-r-0 z-30 pt-24">
            <div class="px-8 mb-8 flex flex-col gap-2">
                <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-2">
                    <span class="material-symbols-outlined text-white text-3xl" style="font-variation-settings: 'FILL' 1;">bolt</span>
                </div>
                <h2 class="text-lg font-black text-slate-900 dark:text-white headline-font leading-tight">Gestión de Asistencia</h2>
                <p class="text-xs font-['Public_Sans'] font-semibold text-primary uppercase tracking-wider">Sistema Pulso Eléctrico</p>
            </div>
            
            <nav class="flex-1 flex flex-col gap-1">
                <a class="nav-item active flex items-center gap-4 py-3 px-8 text-slate-600 hover:bg-slate-100 rounded-r-full mr-4 transition-all hover:translate-x-1 cursor-pointer" data-target="view-dashboard">
                    <span class="material-symbols-outlined pointer-events-none">dashboard</span>
                    <span class="font-['Public_Sans'] text-sm font-semibold pointer-events-none">Panel de Control</span>
                </a>
                <a class="nav-item flex items-center gap-4 py-3 px-8 text-slate-600 hover:bg-slate-100 rounded-r-full mr-4 transition-all hover:translate-x-1 cursor-pointer" data-target="view-directorio">
                    <span class="material-symbols-outlined pointer-events-none" style="font-variation-settings: 'FILL' 1;">badge</span>
                    <span class="font-['Public_Sans'] text-sm font-semibold pointer-events-none">Directorio</span>
                </a>
                <a class="nav-item flex items-center gap-4 py-3 px-8 text-slate-600 hover:bg-slate-100 rounded-r-full mr-4 transition-all hover:translate-x-1 cursor-pointer" data-target="view-qr">
                    <span class="material-symbols-outlined pointer-events-none">qr_code</span>
                    <span class="font-['Public_Sans'] text-sm font-semibold pointer-events-none">Generar QR</span>
                </a>
                <a class="nav-item flex items-center gap-4 py-3 px-8 text-slate-600 hover:bg-slate-100 rounded-r-full mr-4 transition-all hover:translate-x-1 cursor-pointer" data-target="view-escaner">
                    <span class="material-symbols-outlined pointer-events-none">qr_code_scanner</span>
                    <span class="font-['Public_Sans'] text-sm font-semibold pointer-events-none">Terminal de Escaneo</span>
                </a>
                <a class="nav-item flex items-center gap-4 py-3 px-8 text-slate-600 hover:bg-slate-100 rounded-r-full mr-4 transition-all hover:translate-x-1 cursor-pointer" data-target="view-reportes">
                    <span class="material-symbols-outlined pointer-events-none">analytics</span>
                    <span class="font-['Public_Sans'] text-sm font-semibold pointer-events-none">Reportes</span>
                </a>
            </nav>
            
            <div class="px-8 mt-auto flex flex-col gap-4">
                <button class="nav-item bg-primary-container text-on-primary-container py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/20 text-white cursor-pointer" data-target="view-escaner">
                    <span class="material-symbols-outlined pointer-events-none">qr_code_2</span>
                    Escanear Ahora
                </button>
            </div>
        </aside>

        <!-- Main Content Area -->
        <main class="ml-64 w-full min-h-screen bg-surface px-12 py-8 pt-24">
            <div id="alert-container"></div>
            
            <!-- VIEW: DASHBOARD -->
            <section id="view-dashboard" class="view active">
                <div class="flex justify-between items-end mb-12">
                    <div class="max-w-2xl">
                        <h1 class="text-6xl font-black text-on-surface headline-font tracking-tighter mb-4 leading-none">Panel de <span class="text-primary-container">Control</span></h1>
                        <p class="text-on-surface-variant font-body text-lg max-w-md">Sistema integral de gestión de asistencia digital y terminal de seguridad.</p>
                    </div>
                </div>
                
                <div class="mt-12 grid grid-cols-3 gap-8">
                    <div class="bg-surface-container-low p-8 rounded-3xl col-span-1 nav-item cursor-pointer" data-target="view-reportes">
                        <h5 class="text-xs font-black uppercase tracking-widest text-primary mb-6 pointer-events-none">Cumplimiento de Seguridad</h5>
                        <div class="flex items-center gap-4 mb-4 pointer-events-none">
                            <div class="w-2 h-10 bg-primary rounded-full"></div>
                            <p class="text-on-surface font-bold text-lg leading-tight">Acceso rápido a los registros y auditoría de asistencias.</p>
                        </div>
                        <button class="text-on-surface-variant text-xs font-bold flex items-center gap-2 hover:text-primary transition-colors pointer-events-none">
                            VER REGISTRO DE AUDITORÍA <span class="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                    <div class="bg-surface-container-highest p-8 rounded-3xl col-span-2 relative overflow-hidden group nav-item cursor-pointer" data-target="view-escaner">
                        <div class="relative z-10 pointer-events-none">
                            <h5 class="text-xs font-black uppercase tracking-widest text-tertiary mb-2">Terminal de Acceso Seguro</h5>
                            <h3 class="text-2xl font-black text-on-surface headline-font mb-4">Iniciar escáner de biometría y códigos QR.</h3>
                            <p class="text-on-surface-variant text-sm max-w-sm">Asegure que las terminales estén conectadas a la red local para sincronización.</p>
                        </div>
                        <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    </div>
                </div>
            </section>

            <!-- VIEW: DIRECTORIO -->
            <section id="view-directorio" class="view">
                <div class="flex justify-between items-end mb-12">
                    <div class="max-w-2xl">
                        <h1 class="text-5xl font-black text-on-surface headline-font tracking-tighter mb-4 leading-none">Directorio de <span class="text-primary-container">Empleados</span></h1>
                        <p class="text-on-surface-variant font-body text-lg max-w-md">Base de datos integral del personal de Corpoelec y credenciales de seguridad.</p>
                    </div>
                    <div class="flex gap-4">
                        <button class="flex items-center gap-2 px-8 py-4 bg-surface-container-lowest text-on-surface border border-transparent hover:bg-surface-container-low transition-all font-bold rounded-xl shadow-sm">
                            <span class="material-symbols-outlined">filter_list</span> Filtros
                        </button>
                        <button onclick="document.getElementById('addModal').classList.add('active')" class="flex items-center gap-2 px-8 py-4 bg-primary text-white hover:bg-primary-container transition-all font-bold rounded-xl shadow-[0_10px_30px_rgba(181,0,11,0.2)]">
                            <span class="material-symbols-outlined">person_add</span> Añadir Empleado
                        </button>
                    </div>
                </div>

                <div class="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
                    <div class="grid grid-cols-12 bg-surface-dim/30 px-10 py-6 border-b-0">
                        <div class="col-span-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Empleado</div>
                        <div class="col-span-3 text-xs font-black text-on-surface-variant uppercase tracking-widest text-center">Cédula</div>
                        <div class="col-span-3 text-xs font-black text-on-surface-variant uppercase tracking-widest">Usuario</div>
                        <div class="col-span-2 text-xs font-black text-on-surface-variant uppercase tracking-widest text-right">Acciones</div>
                    </div>
                    <div id="tabla-directorio" class="flex flex-col">
                        <!-- Llenado dinamicamente -->
                    </div>
                </div>
            </section>

            <!-- VIEW: GENERAR QR -->
            <section id="view-qr" class="view">
                <div class="bg-white w-full max-w-2xl rounded-3xl shadow-sm overflow-hidden p-10 mx-auto mt-4 border border-slate-100">
                    <div class="mb-8">
                        <h3 class="text-3xl font-black headline-font text-on-surface leading-none">Terminal de Credenciales QR</h3>
                        <p class="text-on-surface-variant mt-2 font-medium">Consulte y genere la credencial QR del personal registrado para imprimir o enviar.</p>
                    </div>
                    <div class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-xs font-black text-on-surface-variant uppercase tracking-widest">Seleccionar Usuario</label>
                            <select id="select-usuario-qr" class="w-full px-6 py-4 bg-surface-container-low border-0 focus:ring-2 focus:ring-primary rounded-xl font-medium appearance-none">
                                <option value="">Cargando usuarios...</option>
                            </select>
                        </div>
                        <button id="btn-generar-qr" class="w-full px-8 py-4 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-slate-300 transition-colors">Mostrar QR</button>
                        
                        <div id="qr-result-box" class="hidden mt-8 pt-8 border-t border-slate-100 flex-col items-center justify-center">
                            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 inline-block">
                                <div id="qrcode"></div>
                            </div>
                            <p id="qr-user-name" class="text-xl font-black headline-font text-primary"></p>
                            <p class="text-sm font-semibold text-slate-400 uppercase tracking-widest mt-1">Credencial Activa</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- VIEW: ESCANER -->
            <section id="view-escaner" class="view">
                <div class="w-full max-w-3xl bg-white rounded-[40px] shadow-[0_10px_60px_rgba(0,0,0,0.03)] p-12 flex flex-col items-center text-center mx-auto mt-4 border border-slate-100">
                    <h1 class="text-4xl font-black text-slate-900 headline-font mb-4">Escáner de Acceso</h1>
                    <p class="text-slate-500 font-medium mb-10">Posicione la credencial QR frente a la cámara para registrar la entrada.</p>
                    <div class="w-full max-w-xl min-h-[300px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center relative group overflow-hidden">
                        <div class="absolute top-4 right-4 z-0 pointer-events-none">
                            <span class="material-symbols-outlined text-slate-400 text-lg">info</span>
                        </div>
                        <div class="mb-6 z-0 pointer-events-none flex flex-col items-center">
                            <span class="material-symbols-outlined text-6xl text-slate-400">phone_iphone</span>
                            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
                                <span class="material-symbols-outlined text-9xl">qr_code_2</span>
                            </div>
                        </div>
                        <div id="reader" class="w-full h-full absolute inset-0 z-10 flex flex-col items-center justify-center"></div>
                    </div>
                    <div id="scanner-result" class="mt-6 w-full max-w-lg p-4 rounded-xl font-bold text-center text-lg"></div>
                </div>
            </section>

            <!-- VIEW: REPORTES -->
            <section id="view-reportes" class="view">
                <div class="flex justify-between items-end mb-8">
                    <div class="max-w-2xl">
                        <h1 class="text-4xl font-black text-on-surface headline-font tracking-tighter mb-2 leading-none">Registro de <span class="text-primary-container">Asistencias</span></h1>
                        <p class="text-on-surface-variant font-body text-lg">Histórico consolidado de entradas del personal.</p>
                    </div>
                    <div class="flex gap-4 items-center">
                        <input type="date" id="filter-date" class="px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 shadow-sm focus:ring-2 focus:ring-primary" />
                        <button id="btn-filter" class="px-6 py-3 bg-surface-container-highest text-on-surface hover:bg-slate-300 transition-all font-bold rounded-xl shadow-sm">Filtrar</button>
                    </div>
                </div>

                <div class="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.02)] border border-slate-100">
                    <div class="grid grid-cols-12 bg-surface-dim/30 px-10 py-6 border-b-0">
                        <div class="col-span-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Empleado</div>
                        <div class="col-span-2 text-xs font-black text-on-surface-variant uppercase tracking-widest text-center">Cédula</div>
                        <div class="col-span-2 text-xs font-black text-on-surface-variant uppercase tracking-widest text-center">Fecha</div>
                        <div class="col-span-2 text-xs font-black text-on-surface-variant uppercase tracking-widest text-center">Hora</div>
                        <div class="col-span-2 text-xs font-black text-on-surface-variant uppercase tracking-widest text-right">Método</div>
                    </div>
                    <div id="tabla-asistencias" class="flex flex-col">
                        <!-- Llenado dinámicamente -->
                    </div>
                </div>
            </section>

        </main>
    </div>

    <!-- Add Employee Modal -->
    <div class="modal fixed inset-0 z-50 items-center justify-center bg-on-background/40 backdrop-blur-sm" id="addModal">
        <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden p-10">
            <div class="flex justify-between items-start mb-8">
                <div>
                    <h3 class="text-3xl font-black headline-font text-on-surface leading-none">Registrar Personal</h3>
                    <p class="text-on-surface-variant mt-2 font-medium">Agregue un nuevo trabajador al sistema.</p>
                </div>
                <button class="material-symbols-outlined p-2 hover:bg-surface-container-low rounded-full transition-colors" onclick="document.getElementById('addModal').classList.remove('active')" type="button">close</button>
            </div>
            
            <form id="form-usuario" class="space-y-6">
                <div class="grid grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="text-xs font-black text-on-surface-variant uppercase tracking-widest">Nombres</label>
                        <input id="nombres" required class="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium" placeholder="Ej: Juan" type="text" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-black text-on-surface-variant uppercase tracking-widest">Apellidos</label>
                        <input id="apellidos" required class="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium" placeholder="Ej: Pérez" type="text" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-black text-on-surface-variant uppercase tracking-widest">Cédula (ID)</label>
                        <input id="cedula" required class="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium" placeholder="V-00000000" type="text" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-black text-on-surface-variant uppercase tracking-widest">Correo Electrónico</label>
                        <input id="correo" required class="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium" placeholder="correo@corpoelec.gob.ve" type="email" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-black text-on-surface-variant uppercase tracking-widest">Usuario</label>
                        <input id="usuario" required class="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium" placeholder="jperez" type="text" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-black text-on-surface-variant uppercase tracking-widest">Contraseña</label>
                        <input id="password" required class="w-full px-6 py-4 bg-surface-container-low border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-xl font-medium" placeholder="••••••••" type="password" />
                    </div>
                </div>
                
                <div class="flex gap-4 pt-6">
                    <button class="flex-1 px-8 py-4 bg-surface-container-high text-on-surface font-bold rounded-xl" onclick="document.getElementById('addModal').classList.remove('active')" type="button">Cancelar</button>
                    <button class="flex-1 px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30" type="submit">Registrar Empleado</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Scripts de Logica -->
    <script src="app.js"></script>
    
    <!-- Adaptadores para diseño Tailwind -->
    <script>
        // Override the specific navigation logic from app.js because it was breaking our modal button.
        // In app.js it binds to all '.nav-item', we just need to make sure we load custom data when specific views open.
        
        // Custom override for show alert to close modal
        const originalShowAlert = showAlert;
        window.showAlert = function(message, type) {
            originalShowAlert(message, type);
            if(type === 'success' && message.includes('exitosamente')) {
                document.getElementById('addModal').classList.remove('active');
                if(document.getElementById('view-directorio').classList.contains('active')) {
                    loadDirectorio(); // refresh list
                }
            }
        };

        // Render Directory Table
        async function loadDirectorio() {
            const tbody = document.getElementById('tabla-directorio');
            if(!tbody) return;
            tbody.innerHTML = '<div class="px-10 py-8 text-center text-slate-500 font-medium">Cargando...</div>';
            try {
                const res = await fetch('/api/usuarios');
                const usuarios = await res.json();
                
                if (usuarios.length === 0) {
                    tbody.innerHTML = '<div class="px-10 py-8 text-center text-slate-500 font-medium">No hay empleados registrados.</div>';
                    return;
                }

                tbody.innerHTML = '';
                usuarios.forEach((u, index) => {
                    const isEven = index % 2 === 0;
                    const bgClass = isEven ? 'hover:bg-surface-container-low' : 'bg-surface-container-low/20 hover:bg-surface-container-low';
                    const initials = u.nombres.charAt(0) + u.apellidos.charAt(0);
                    
                    const row = document.createElement('div');
                    row.className = `grid grid-cols-12 items-center px-10 py-6 transition-colors group ${bgClass} border-b border-slate-50`;
                    row.innerHTML = `
                        <div class="col-span-4 flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                ${initials}
                            </div>
                            <div>
                                <h4 class="text-on-surface font-bold headline-font text-lg leading-tight">${u.nombres} ${u.apellidos}</h4>
                                <p class="text-primary text-xs font-bold uppercase tracking-tighter">Activo</p>
                            </div>
                        </div>
                        <div class="col-span-3 text-center">
                            <span class="px-4 py-2 bg-surface-container-high rounded-full font-mono text-sm text-on-surface-variant font-bold">V-${u.cedula_identidad}</span>
                        </div>
                        <div class="col-span-3">
                            <p class="text-on-surface font-semibold text-sm">${u.correo}</p>
                            <p class="text-on-surface-variant text-xs font-medium">@${u.usuario}</p>
                        </div>
                        <div class="col-span-2 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="document.querySelector('[data-target=view-qr]').click();" class="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary-container/20 text-on-secondary-container hover:bg-secondary-container transition-all" title="Generar QR">
                                <span class="material-symbols-outlined text-[20px]">qr_code</span>
                            </button>
                        </div>
                    `;
                    tbody.appendChild(row);
                });
            } catch (err) {
                tbody.innerHTML = '<div class="px-10 py-8 text-center text-red-500 font-medium">Error cargando directorio</div>';
            }
        }
        
        // Listen to navigation events natively
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const targetView = item.getAttribute('data-target');
                if (targetView === 'view-directorio') loadDirectorio();
            });
        });

        // Cargar directorio inicial si la vista es directorio
        if(document.getElementById('view-directorio').classList.contains('active')) {
            loadDirectorio();
        } else {
            // we default to dashboard now, so no need to load it initially
        }

        // Adapter for Attendances Table
        window.loadAsistencias = async function(filterDate = '') {
            const tbody = document.getElementById('tabla-asistencias');
            if(!tbody) return;
            tbody.innerHTML = '<div class="px-10 py-8 text-center text-slate-500 font-medium">Cargando...</div>';
            try {
                const res = await fetch('/api/asistencias');
                let asistencias = await res.json();
                
                if (filterDate) {
                    asistencias = asistencias.filter(a => a.fecha === filterDate);
                }
                
                if (asistencias.length === 0) {
                    tbody.innerHTML = '<div class="px-10 py-8 text-center text-slate-500 font-medium">No hay registros de asistencia.</div>';
                    return;
                }

                tbody.innerHTML = '';
                asistencias.forEach((a, index) => {
                    const isEven = index % 2 === 0;
                    const bgClass = isEven ? 'hover:bg-surface-container-low' : 'bg-surface-container-low/20 hover:bg-surface-container-low';
                    const initials = a.nombres.charAt(0) + a.apellidos.charAt(0);
                    
                    const row = document.createElement('div');
                    row.className = `grid grid-cols-12 items-center px-10 py-6 transition-colors group ${bgClass} border-b border-slate-50`;
                    row.innerHTML = `
                        <div class="col-span-4 flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary font-bold">
                                ${initials}
                            </div>
                            <div>
                                <h4 class="text-on-surface font-bold headline-font text-base leading-tight">${a.nombres} ${a.apellidos}</h4>
                            </div>
                        </div>
                        <div class="col-span-2 text-center">
                            <span class="px-3 py-1 bg-surface-container-high rounded-full font-mono text-xs text-on-surface-variant font-bold">V-${a.cedula}</span>
                        </div>
                        <div class="col-span-2 text-center">
                            <p class="text-on-surface font-semibold text-sm">${a.fecha}</p>
                        </div>
                        <div class="col-span-2 text-center">
                            <p class="text-on-surface font-semibold text-sm">${a.hora}</p>
                        </div>
                        <div class="col-span-2 text-right">
                            <span class="text-xs font-bold uppercase tracking-wider text-primary">${a.metodo}</span>
                        </div>
                    `;
                    tbody.appendChild(row);
                });
            } catch (err) {
                tbody.innerHTML = '<div class="px-10 py-8 text-center text-red-500 font-medium">Error de conexión al cargar datos</div>';
            }
        };

        // Fix QR Box display logic
        document.getElementById('btn-generar-qr').addEventListener('click', () => {
            setTimeout(() => {
                const box = document.getElementById('qr-result-box');
                if (box.style.display === 'block') {
                    box.style.display = 'flex';
                }
            }, 10);
        });
    </script>
</body>
</html>
"""

with open('corpoelec.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("corpoelec.html rebuilt successfully.")
