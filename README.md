<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoldenTime Pro - VERSIONE DEBUG</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.0/feather.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #1a365d 0%, #2c5f41 50%, #b8860b 100%);
            color: #333;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            background: rgba(26, 54, 93, 0.95);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }

        .mode-switcher {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }

        .mode-btn {
            background: #6c757d;
            color: white;
            border: none;
            padding: 15px 30px;
            margin: 10px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }

        .mode-btn.active {
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #1a365d;
        }

        .mode-btn:hover {
            transform: translateY(-2px);
        }

        .section {
            background: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 20px;
            display: none;
        }

        .section.active {
            display: block;
        }

        .section h2 {
            color: #1a365d;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .employee-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .employee-card {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border: 2px solid #d4af37;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }

        .employee-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
            background: linear-gradient(135deg, #d4af37, #ffd700);
            color: #1a365d;
        }

        .employee-name {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .employee-details {
            font-size: 1rem;
            opacity: 0.8;
        }

        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;
            margin-top: 10px;
        }

        .status-in {
            background: #28a745;
            color: white;
        }

        .status-out {
            background: #6c757d;
            color: white;
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }

        .form-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            border: 2px solid #d4af37;
        }

        .form-section h3 {
            color: #1a365d;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #1a365d;
            font-weight: bold;
        }

        .form-group input, .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #d4af37;
            border-radius: 8px;
            font-size: 16px;
        }

        .btn {
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #1a365d;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
            margin: 5px;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(212, 175, 55, 0.4);
        }

        .btn-danger {
            background: linear-gradient(45deg, #dc3545, #c82333);
            color: white;
        }

        .btn-success {
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
        }

        .btn-secondary {
            background: linear-gradient(45deg, #6c757d, #868e96);
            color: white;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
        }

        .data-table th, .data-table td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }

        .data-table th {
            background: linear-gradient(135deg, #1a365d, #2c5f41);
            color: #d4af37;
            font-weight: bold;
        }

        .data-table tr:hover {
            background: rgba(212, 175, 55, 0.1);
        }

        .debug-console {
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 400px;
            max-height: 300px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            padding: 15px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 12px;
            overflow-y: auto;
            z-index: 1000;
            border: 2px solid #d4af37;
        }

        .debug-console h4 {
            color: #d4af37;
            margin-bottom: 10px;
        }

        .debug-line {
            margin-bottom: 5px;
            word-wrap: break-word;
        }

        .error {
            color: #ff6b6b;
        }

        .success {
            color: #51cf66;
        }

        .warning {
            color: #ffd43b;
        }

        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            z-index: 9999;
            max-width: 400px;
            font-size: 16px;
        }

        .notification.success {
            background: linear-gradient(45deg, #28a745, #20c997);
        }

        .notification.error {
            background: linear-gradient(45deg, #dc3545, #c82333);
        }

        .notification.info {
            background: linear-gradient(45deg, #1a365d, #2c5f41);
        }

        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
            
            .debug-console {
                width: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🕐 GoldenTime Pro - VERSIONE DEBUG</h1>
            <p>Versione semplificata per risolvere i problemi</p>
            <div id="currentTime" style="font-size: 1.5rem; margin-top: 10px;">--:--:--</div>
        </div>

        <!-- Mode Switcher -->
        <div class="mode-switcher">
            <h3>🔄 Seleziona Modalità:</h3>
            <button class="mode-btn active" id="employeeModeBtn" onclick="switchToEmployee()">
                👥 MODALITÀ DIPENDENTE
            </button>
            <button class="mode-btn" id="adminModeBtn" onclick="switchToAdmin()">
                ⚙️ MODALITÀ AMMINISTRATORE
            </button>
            
            <div style="margin-top: 15px;">
                <button class="btn btn-danger" onclick="forceAdminMode()">
                    🚨 FORZA MODALITÀ ADMIN
                </button>
                <button class="btn btn-secondary" onclick="debugTest()">
                    🔧 TEST DEBUG
                </button>
            </div>
        </div>

        <!-- Employee Mode -->
        <div id="employeeSection" class="section active">
            <h2>👥 Modalità Dipendente</h2>
            <p style="margin-bottom: 20px;">Clicca sul tuo nome per timbrare entrata/uscita:</p>
            
            <div class="employee-grid" id="employeeGrid">
                <!-- Will be populated by JavaScript -->
            </div>

            <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin-top: 20px;">
                <h4>🧪 Test NFC Simulato:</h4>
                <button class="btn" onclick="testNFC('NFC001')">Test NFC001 (Marco)</button>
                <button class="btn" onclick="testNFC('NFC002')">Test NFC002 (Laura)</button>
                <button class="btn" onclick="testNFC('NFC003')">Test NFC003 (Giuseppe)</button>
            </div>
        </div>

        <!-- Admin Mode -->
        <div id="adminSection" class="section">
            <h2>⚙️ Modalità Amministratore</h2>
            
            <div class="form-grid">
                <!-- Add Employee Form -->
                <div class="form-section">
                    <h3>👤 Aggiungi Dipendente</h3>
                    
                    <div class="form-group">
                        <label>Matricola:</label>
                        <input type="text" id="empMatricola" placeholder="es. EMP004">
                    </div>
                    <div class="form-group">
                        <label>Nome Completo:</label>
                        <input type="text" id="empName" placeholder="es. Mario Rossi">
                    </div>
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="empEmail" placeholder="es. mario@company.com">
                    </div>
                    <div class="form-group">
                        <label>Ruolo:</label>
                        <input type="text" id="empRole" placeholder="es. Sviluppatore">
                    </div>
                    <div class="form-group">
                        <label>Reparto:</label>
                        <select id="empDepartment">
                            <option value="">Seleziona reparto</option>
                            <option value="IT">IT</option>
                            <option value="Vendite">Vendite</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Amministrazione">Amministrazione</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Badge NFC ID:</label>
                        <input type="text" id="empNfcId" placeholder="es. NFC004">
                    </div>
                    
                    <button class="btn btn-success" onclick="addEmployeeSimple()">
                        ➕ Aggiungi Dipendente
                    </button>
                    
                    <button class="btn btn-secondary" onclick="addTestEmployee()">
                        🧪 Aggiungi Test Employee
                    </button>
                </div>

                <!-- Employee List -->
                <div class="form-section">
                    <h3>📋 Lista Dipendenti</h3>
                    <div style="margin-bottom: 15px;">
                        <strong>Totale Dipendenti: <span id="employeeCount">0</span></strong>
                    </div>
                    
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Matricola</th>
                                <th>Nome</th>
                                <th>Stato</th>
                                <th>Azioni</th>
                            </tr>
                        </thead>
                        <tbody id="employeeTableBody">
                            <!-- Will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Debug Console -->
    <div class="debug-console" id="debugConsole">
        <h4>🔧 DEBUG CONSOLE</h4>
        <div id="debugOutput">
            <div class="success">✅ Sistema caricato</div>
        </div>
        <div style="margin-top: 10px;">
            <button onclick="clearDebug()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 10px;">
                Pulisci
            </button>
            <button onclick="toggleDebug()" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 10px;">
                Nascondi
            </button>
        </div>
    </div>

    <script>
        // ===== GLOBAL VARIABLES =====
        var currentMode = 'employee';
        var employees = [
            {
                id: 1,
                matricola: 'EMP001',
                name: 'Marco Rossi',
                email: 'marco.rossi@company.com',
                role: 'Senior Developer',
                department: 'IT',
                nfcId: 'NFC001',
                status: 'out',
                clockedIn: false
            },
            {
                id: 2,
                matricola: 'EMP002',
                name: 'Laura Bianchi',
                email: 'laura.bianchi@company.com',
                role: 'UI/UX Designer',
                department: 'Marketing',
                nfcId: 'NFC002',
                status: 'in',
                clockedIn: true
            },
            {
                id: 3,
                matricola: 'EMP003',
                name: 'Giuseppe Verdi',
                email: 'giuseppe.verdi@company.com',
                role: 'Project Manager',
                department: 'Amministrazione',
                nfcId: 'NFC003',
                status: 'out',
                clockedIn: false
            }
        ];
        var punches = [];

        // ===== DEBUG FUNCTIONS =====
        function debugLog(message, type) {
            type = type || 'info';
            var output = document.getElementById('debugOutput');
            var line = document.createElement('div');
            line.className = 'debug-line ' + type;
            line.innerHTML = new Date().toLocaleTimeString() + ' - ' + message;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
            console.log('[DEBUG]', message);
        }

        function clearDebug() {
            document.getElementById('debugOutput').innerHTML = '<div class="success">✅ Debug pulito</div>';
        }

        function toggleDebug() {
            var console = document.getElementById('debugConsole');
            console.style.display = console.style.display === 'none' ? 'block' : 'none';
        }

        // ===== NOTIFICATION SYSTEM =====
        function showNotification(message, type) {
            debugLog('Notification: ' + message, type);
            
            // Remove existing notifications
            var existing = document.querySelectorAll('.notification');
            for (var i = 0; i < existing.length; i++) {
                existing[i].remove();
            }
            
            var notification = document.createElement('div');
            notification.className = 'notification ' + type;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(function() {
                notification.remove();
            }, 4000);
        }

        // ===== MODE SWITCHING =====
        function switchToEmployee() {
            debugLog('🔄 Switching to Employee Mode', 'info');
            try {
                currentMode = 'employee';
                
                // Hide admin, show employee
                document.getElementById('adminSection').style.display = 'none';
                document.getElementById('employeeSection').style.display = 'block';
                
                // Update buttons
                document.getElementById('employeeModeBtn').classList.add('active');
                document.getElementById('adminModeBtn').classList.remove('active');
                
                debugLog('✅ Employee mode activated', 'success');
                showNotification('✅ Modalità Dipendente attivata', 'success');
                
            } catch (error) {
                debugLog('❌ Error switching to employee: ' + error.message, 'error');
                showNotification('❌ Errore: ' + error.message, 'error');
            }
        }

        function switchToAdmin() {
            debugLog('🔄 Switching to Admin Mode', 'info');
            try {
                currentMode = 'admin';
                
                // Hide employee, show admin
                document.getElementById('employeeSection').style.display = 'none';
                document.getElementById('adminSection').style.display = 'block';
                
                // Update buttons
                document.getElementById('employeeModeBtn').classList.remove('active');
                document.getElementById('adminModeBtn').classList.add('active');
                
                // Load admin data
                loadEmployeeTable();
                
                debugLog('✅ Admin mode activated', 'success');
                showNotification('✅ Modalità Amministratore attivata', 'success');
                
            } catch (error) {
                debugLog('❌ Error switching to admin: ' + error.message, 'error');
                showNotification('❌ Errore: ' + error.message, 'error');
            }
        }

        function forceAdminMode() {
            debugLog('🚨 FORCE ADMIN MODE ACTIVATED', 'warning');
            try {
                // Force everything
                currentMode = 'admin';
                
                var employeeSection = document.getElementById('employeeSection');
                var adminSection = document.getElementById('adminSection');
                
                if (employeeSection) employeeSection.style.display = 'none';
                if (adminSection) adminSection.style.display = 'block';
                
                var employeeBtn = document.getElementById('employeeModeBtn');
                var adminBtn = document.getElementById('adminModeBtn');
                
                if (employeeBtn) employeeBtn.classList.remove('active');
                if (adminBtn) adminBtn.classList.add('active');
                
                loadEmployeeTable();
                
                debugLog('✅ FORCE ADMIN MODE SUCCESS', 'success');
                showNotification('🚨 MODALITÀ ADMIN FORZATA!', 'success');
                
            } catch (error) {
                debugLog('❌ FORCE ADMIN FAILED: ' + error.message, 'error');
                showNotification('❌ Errore forzatura: ' + error.message, 'error');
            }
        }

        // ===== EMPLOYEE FUNCTIONS =====
        function loadEmployeeGrid() {
            debugLog('📋 Loading employee grid', 'info');
            try {
                var grid = document.getElementById('employeeGrid');
                grid.innerHTML = '';
                
                for (var i = 0; i < employees.length; i++) {
                    var emp = employees[i];
                    var card = document.createElement('div');
                    card.className = 'employee-card';
                    card.onclick = function(id) {
                        return function() { togglePunch(id); };
                    }(emp.id);
                    
                    card.innerHTML = 
                        '<div class="employee-name">' + emp.name + '</div>' +
                        '<div class="employee-details">Mat: ' + emp.matricola + '<br>' + emp.role + '</div>' +
                        '<div class="status-badge ' + (emp.clockedIn ? 'status-in' : 'status-out') + '">' +
                        (emp.clockedIn ? 'IN SERVIZIO' : 'FUORI SERVIZIO') + '</div>';
                    
                    grid.appendChild(card);
                }
                
                debugLog('✅ Employee grid loaded: ' + employees.length + ' employees', 'success');
                
            } catch (error) {
                debugLog('❌ Error loading employee grid: ' + error.message, 'error');
            }
        }

        function loadEmployeeTable() {
            debugLog('📊 Loading employee table', 'info');
            try {
                var tbody = document.getElementById('employeeTableBody');
                tbody.innerHTML = '';
                
                for (var i = 0; i < employees.length; i++) {
                    var emp = employees[i];
                    var row = document.createElement('tr');
                    
                    row.innerHTML = 
                        '<td><strong>' + emp.matricola + '</strong></td>' +
                        '<td>' + emp.name + '<br><small>' + emp.email + '</small></td>' +
                        '<td><span class="status-badge ' + (emp.clockedIn ? 'status-in' : 'status-out') + '">' +
                        (emp.clockedIn ? 'IN SERVIZIO' : 'FUORI SERVIZIO') + '</span></td>' +
                        '<td><button class="btn btn-danger" onclick="deleteEmployee(' + emp.id + ')">🗑️ Elimina</button></td>';
                    
                    tbody.appendChild(row);
                }
                
                document.getElementById('employeeCount').textContent = employees.length;
                debugLog('✅ Employee table loaded: ' + employees.length + ' employees', 'success');
                
            } catch (error) {
                debugLog('❌ Error loading employee table: ' + error.message, 'error');
            }
        }

        function togglePunch(employeeId) {
            debugLog('⏰ Toggling punch for employee ID: ' + employeeId, 'info');
            try {
                var employee = null;
                for (var i = 0; i < employees.length; i++) {
                    if (employees[i].id === employeeId) {
                        employee = employees[i];
                        break;
                    }
                }
                
                if (!employee) {
                    debugLog('❌ Employee not found', 'error');
                    return;
                }
                
                var punchType = employee.clockedIn ? 'out' : 'in';
                employee.clockedIn = !employee.clockedIn;
                employee.status = employee.clockedIn ? 'in' : 'out';
                
                var punch = {
                    id: punches.length + 1,
                    employeeId: employeeId,
                    employeeName: employee.name,
                    type: punchType,
                    timestamp: new Date().toISOString()
                };
                
                punches.push(punch);
                
                debugLog('✅ Punch recorded: ' + employee.name + ' - ' + punchType.toUpperCase(), 'success');
                showNotification('✅ ' + employee.name + ' - ' + (punchType === 'in' ? 'ENTRATA' : 'USCITA') + ' registrata!', 'success');
                
                loadEmployeeGrid();
                if (currentMode === 'admin') {
                    loadEmployeeTable();
                }
                
            } catch (error) {
                debugLog('❌ Error processing punch: ' + error.message, 'error');
            }
        }

        function testNFC(nfcId) {
            debugLog('🧪 Testing NFC: ' + nfcId, 'info');
            try {
                var employee = null;
                for (var i = 0; i < employees.length; i++) {
                    if (employees[i].nfcId === nfcId) {
                        employee = employees[i];
                        break;
                    }
                }
                
                if (employee) {
                    showNotification('📡 NFC ' + nfcId + ' rilevato: ' + employee.name, 'info');
                    setTimeout(function() {
                        togglePunch(employee.id);
                    }, 1000);
                } else {
                    debugLog('❌ NFC ID not found: ' + nfcId, 'error');
                    showNotification('❌ Badge NFC ' + nfcId + ' non riconosciuto', 'error');
                }
                
            } catch (error) {
                debugLog('❌ Error testing NFC: ' + error.message, 'error');
            }
        }

        // ===== ADMIN FUNCTIONS =====
        function addEmployeeSimple() {
            debugLog('👤 Adding new employee', 'info');
            try {
                var matricola = document.getElementById('empMatricola').value.trim();
                var name = document.getElementById('empName').value.trim();
                var email = document.getElementById('empEmail').value.trim();
                var role = document.getElementById('empRole').value.trim();
                var department = document.getElementById('empDepartment').value;
                var nfcId = document.getElementById('empNfcId').value.trim();
                
                debugLog('Form data: ' + JSON.stringify({matricola, name, email, role, department, nfcId}), 'info');
                
                // Validate
                if (!matricola || !name || !email || !role || !department) {
                    debugLog('❌ Missing required fields', 'error');
                    showNotification('❌ Compila tutti i campi obbligatori!', 'error');
                    return;
                }
                
                // Check duplicates
                for (var i = 0; i < employees.length; i++) {
                    if (employees[i].matricola === matricola) {
                        debugLog('❌ Duplicate matricola: ' + matricola, 'error');
                        showNotification('❌ Matricola già esistente!', 'error');
                        return;
                    }
                }
                
                var newEmployee = {
                    id: employees.length + 1,
                    matricola: matricola,
                    name: name,
                    email: email,
                    role: role,
                    department: department,
                    nfcId: nfcId || 'NFC' + (employees.length + 1).toString().padStart(3, '0'),
                    status: 'out',
                    clockedIn: false
                };
                
                employees.push(newEmployee);
                
                // Clear form
                document.getElementById('empMatricola').value = '';
                document.getElementById('empName').value = '';
                document.getElementById('empEmail').value = '';
                document.getElementById('empRole').value = '';
                document.getElementById('empDepartment').value = '';
                document.getElementById('empNfcId').value = '';
                
                loadEmployeeTable();
                loadEmployeeGrid();
                
                debugLog('✅ Employee added successfully: ' + newEmployee.name, 'success');
                showNotification('✅ ' + newEmployee.name + ' aggiunto con successo!', 'success');
                
            } catch (error) {
                debugLog('❌ Error adding employee: ' + error.message, 'error');
                showNotification('❌ Errore: ' + error.message, 'error');
            }
        }

        function addTestEmployee() {
            debugLog('🧪 Adding test employee', 'info');
            try {
                var timestamp = Date.now().toString().slice(-3);
                var testEmployee = {
                    id: employees.length + 1,
                    matricola: 'TEST' + timestamp,
                    name: 'Test Employee ' + timestamp,
                    email: 'test' + timestamp + '@company.com',
                    role: 'Tester',
                    department: 'IT',
                    nfcId: 'NFC' + timestamp,
                    status: 'out',
                    clockedIn: false
                };
                
                employees.push(testEmployee);
                
                loadEmployeeTable();
                loadEmployeeGrid();
                
                debugLog('✅ Test employee added: ' + testEmployee.name, 'success');
                showNotification('✅ Test employee aggiunto: ' + testEmployee.name, 'success');
                
            } catch (error) {
                debugLog('❌ Error adding test employee: ' + error.message, 'error');
            }
        }

        function deleteEmployee(employeeId) {
            debugLog('🗑️ Deleting employee ID: ' + employeeId, 'info');
            try {
                var employee = null;
                for (var i = 0; i < employees.length; i++) {
                    if (employees[i].id === employeeId) {
                        employee = employees[i];
                        break;
                    }
                }
                
                if (!employee) {
                    debugLog('❌ Employee not found for deletion', 'error');
                    return;
                }
                
                if (confirm('Sei sicuro di voler eliminare ' + employee.name + '?')) {
                    employees = employees.filter(function(emp) {
                        return emp.id !== employeeId;
                    });
                    
                    loadEmployeeTable();
                    loadEmployeeGrid();
                    
                    debugLog('✅ Employee deleted: ' + employee.name, 'success');
                    showNotification('🗑️ ' + employee.name + ' eliminato', 'success');
                }
                
            } catch (error) {
                debugLog('❌ Error deleting employee: ' + error.message, 'error');
            }
        }

        // ===== UTILITY FUNCTIONS =====
        function updateTime() {
            try {
                var now = new Date();
                var timeString = now.toLocaleTimeString('it-IT');
                document.getElementById('currentTime').textContent = timeString;
            } catch (error) {
                debugLog('❌ Error updating time: ' + error.message, 'error');
            }
        }

        function debugTest() {
            debugLog('🧪 RUNNING DEBUG TEST', 'warning');
            try {
                debugLog('Current mode: ' + currentMode, 'info');
                debugLog('Employees count: ' + employees.length, 'info');
                debugLog('Punches count: ' + punches.length, 'info');
                debugLog('Employee section display: ' + document.getElementById('employeeSection').style.display, 'info');
                debugLog('Admin section display: ' + document.getElementById('adminSection').style.display, 'info');
                debugLog('✅ Debug test completed', 'success');
                showNotification('🧪 Debug test completato - controlla console', 'info');
            } catch (error) {
                debugLog('❌ Debug test failed: ' + error.message, 'error');
            }
        }

        // ===== INITIALIZATION =====
        document.addEventListener('DOMContentLoaded', function() {
            debugLog('🚀 Initializing GoldenTime Pro DEBUG version', 'info');
            try {
                // Initialize feather icons
                feather.replace();
                
                // Load initial data
                loadEmployeeGrid();
                loadEmployeeTable();
                
                // Start time updates
                updateTime();
                setInterval(updateTime, 1000);
                
                debugLog('✅ System initialized successfully', 'success');
                showNotification('🎯 GoldenTime Pro DEBUG caricato con successo!', 'success');
                
                // Test after 2 seconds
                setTimeout(function() {
                    debugLog('🧪 Running auto-test...', 'info');
                    debugTest();
                }, 2000);
                
            } catch (error) {
                debugLog('❌ Initialization failed: ' + error.message, 'error');
                showNotification('❌ Errore inizializzazione: ' + error.message, 'error');
            }
        });

        // ===== KEYBOARD SHORTCUTS =====
        document.addEventListener('keydown', function(e) {
            try {
                if (e.key === 'F1') {
                    e.preventDefault();
                    switchToEmployee();
                }
                if (e.key === 'F2') {
                    e.preventDefault();
                    switchToAdmin();
                }
                if (e.ctrlKey && e.key === 'a') {
                    e.preventDefault();
                    forceAdminMode();
                }
            } catch (error) {
                debugLog('❌ Keyboard shortcut error: ' + error.message, 'error');
            }
        });

    </script>
</body>
</html>
