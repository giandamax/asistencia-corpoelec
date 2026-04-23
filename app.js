// Nav Logic
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        e.target.classList.add('active');
        
        // Show view
        const targetView = e.target.getAttribute('data-target');
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(targetView).classList.add('active');
        
        // Specific view logic
        if (targetView === 'view-qr') loadUsuariosParaQR();
        if (targetView === 'view-reportes') loadAsistencias();
        if (targetView === 'view-escaner') startScanner();
        else stopScanner(); // Stop camera if navigating away
    });
});

// Alert System
function showAlert(message, type = 'success') {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Usuarios - Form Submit
document.getElementById('form-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = 'Registrando...';
    btn.disabled = true;

    const data = {
        nombres: document.getElementById('nombres').value,
        apellidos: document.getElementById('apellidos').value,
        cedula_identidad: document.getElementById('cedula').value,
        correo: document.getElementById('correo').value,
        usuario: document.getElementById('usuario').value,
        password: document.getElementById('password').value
    };

    try {
        const res = await fetch('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (res.ok) {
            showAlert(result.message, 'success');
            e.target.reset();
        } else {
            showAlert(result.message, 'error');
        }
    } catch (err) {
        showAlert('Error de conexión al servidor', 'error');
    } finally {
        btn.textContent = 'Registrar Usuario';
        btn.disabled = false;
    }
});

// Load Usuarios for QR Dropdown
async function loadUsuariosParaQR() {
    const select = document.getElementById('select-usuario-qr');
    try {
        const res = await fetch('/api/usuarios');
        const usuarios = await res.json();
        select.innerHTML = '<option value="">Seleccione un usuario...</option>';
        usuarios.forEach(u => {
            const option = document.createElement('option');
            option.value = `USER_${u.id}_${u.cedula_identidad}`;
            option.textContent = `${u.nombres} ${u.apellidos} - V-${u.cedula_identidad}`;
            select.appendChild(option);
        });
    } catch (err) {
        select.innerHTML = '<option value="">Error cargando usuarios</option>';
    }
}

// Generate QR
const qrCode = new QRCode(document.getElementById("qrcode"), {
    width: 250,
    height: 250,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
});

document.getElementById('btn-generar-qr').addEventListener('click', () => {
    const select = document.getElementById('select-usuario-qr');
    const qrData = select.value;
    const userName = select.options[select.selectedIndex].text;
    
    if (qrData) {
        qrCode.makeCode(qrData);
        document.getElementById('qr-user-name').textContent = userName;
        document.getElementById('qr-result-box').style.display = 'block';
    } else {
        showAlert('Por favor seleccione un usuario', 'error');
    }
});

// Load Asistencias
async function loadAsistencias(filterDate = '') {
    const tbody = document.getElementById('tabla-asistencias');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>';
    try {
        const res = await fetch('/api/asistencias');
        let asistencias = await res.json();
        
        if (filterDate) {
            asistencias = asistencias.filter(a => a.fecha === filterDate);
        }
        
        if (asistencias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay registros de asistencia.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        asistencias.forEach(a => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${a.nombres}</td>
                <td>${a.apellidos}</td>
                <td>${a.cedula}</td>
                <td>${a.fecha}</td>
                <td>${a.hora}</td>
                <td>${a.metodo}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Error cargando datos</td></tr>';
    }
}

document.getElementById('btn-filter').addEventListener('click', () => {
    const date = document.getElementById('filter-date').value;
    loadAsistencias(date);
});

// QR Scanner Logic
let html5QrcodeScanner = null;

function startScanner() {
    if (html5QrcodeScanner) return;

    const resultBox = document.getElementById('scanner-result');
    resultBox.className = '';
    resultBox.textContent = 'Inicializando cámara...';

    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    
    html5QrcodeScanner.render(async (decodedText, decodedResult) => {
        html5QrcodeScanner.pause();
        
        try {
            const res = await fetch('/api/asistencias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qr_data: decodedText })
            });
            const result = await res.json();
            
            if (res.ok) {
                resultBox.className = 'alert-success';
                resultBox.textContent = result.message;
                showAlert('Entrada registrada', 'success');
            } else {
                resultBox.className = 'alert-error';
                resultBox.textContent = result.message;
                showAlert('Error: ' + result.message, 'error');
            }
        } catch (err) {
            resultBox.className = 'alert-error';
            resultBox.textContent = 'Error de conexión con el servidor.';
        }
        
        setTimeout(() => {
            resultBox.className = '';
            resultBox.textContent = 'Listo para el siguiente escaneo...';
            html5QrcodeScanner.resume();
        }, 3000);
        
    }, (error) => {});
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
        html5QrcodeScanner = null;
    }
}
