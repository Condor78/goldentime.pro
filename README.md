<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoldenTime Pro - Sistema Rilevazione Presenze</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.0/feather.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #1a365d 0%, #2c5f41 50%, #b8860b 100%);
            color: #333;
            line-height: 1.6;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* Header */
        .header {
            background: rgba(26, 54, 93, 0.95);
            backdrop-filter: blur(10px);
            padding: 1rem 0;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            border-bottom: 2px solid #d4af37;
        }

        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #d4af37;
            font-size: 1.8rem;
            font-weight: bold;
        }

        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }

        .nav-links a {
            color: #ffffff;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s;
            cursor: pointer;
        }

        .nav-links a:hover {
            color: #d4af37;
        }

        .admin-btn {
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #1a365d;
            padding: 0.8rem 2rem;
            border: none;
            border-radius: 50px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        }

        .admin-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
        }

        /* Main Content */
        .main-content {
            margin-top: 80px;
            padding: 2rem 0;
        }

        .hero {
            text-align: center;
            margin-bottom: 2rem;
            color: white;
        }

        .hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #d4af37, #ffd700);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        /* Dashboard Layout */
        .dashboard-container {
            display: grid;
            grid-template-columns: 300px 1fr 300px;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .panel {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 1.5rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 2px solid #d4af37;
        }

        .main-panel {
            background: rgba(255, 255, 255, 0.98);
            border: 3px solid #d4af37;
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }

        .panel-title {
            color: #1a365d;
            font-size: 1.3rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 2px solid #d4af37;
            padding-bottom: 0.5rem;
        }

        /* Time Clock */
        .time-clock {
            background: linear-gradient(135deg, #1a365d, #2c5f41);
            color: white;
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            margin-bottom: 1.5rem;
        }

        .current-time {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: #d4af37;
        }

        .current-date {
            font-size: 1rem;
            opacity: 0.8;
            margin-bottom: 1rem;
        }

        .clock-btn {
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #1a365d;
            border: none;
            padding: 1rem 2rem;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 5px 20px rgba(212, 175, 55, 0.3);
            width: 100%;
        }

        .clock-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4);
        }

        .clock-btn.clocked-in {
            background: linear-gradient(45deg, #dc3545, #c82333);
            color: white;
        }

        /* Tracking Methods */
        .tracking-methods {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .method-card {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border: 2px solid #d4af37;
            border-radius: 10px;
            padding: 1rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }

        .method-card:hover, .method-card.active {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2);
            background: linear-gradient(135deg, #d4af37, #ffd700);
            color: #1a365d;
        }

        .method-card i {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: #2c5f41;
        }

        .method-card:hover i, .method-card.active i {
            color: #1a365d;
        }

        /* Employee Management */
        .employee-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .employee-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.8rem;
            background: rgba(212, 175, 55, 0.1);
            border-radius: 8px;
            margin-bottom: 0.5rem;
            border: 1px solid #d4af37;
        }

        .employee-info h4 {
            margin: 0;
            color: #1a365d;
        }

        .employee-info small {
            color: #666;
        }

        .status-badge {
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .status-online {
            background: #d4af37;
            color: #1a365d;
        }

        .status-offline {
            background: #6c757d;
            color: white;
        }

        /* Activity Feed */
        .activity-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.8rem;
            background: linear-gradient(90deg, rgba(212, 175, 55, 0.1), rgba(44, 95, 65, 0.1));
            border-radius: 8px;
            margin-bottom: 0.5rem;
            border-left: 4px solid #d4af37;
        }

        /* Statistics */
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .stat-card {
            background: linear-gradient(135deg, #2c5f41, #1a365d);
            color: white;
            padding: 1.5rem;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #d4af37;
        }

        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #d4af37;
        }

        /* Forms */
        .form-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 0;
            border: 2px solid #d4af37;
            display: none;
        }

        .form-section.active {
            display: block;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #1a365d;
            font-weight: bold;
        }

        .form-group input, .form-group select, .form-group textarea {
            width: 100%;
            padding: 0.8rem;
            border: 2px solid #d4af37;
            border-radius: 8px;
            font-size: 1rem;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            outline: none;
            border-color: #2c5f41;
            box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
        }

        .btn {
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #1a365d;
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 50px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
        }

        .btn-secondary {
            background: linear-gradient(45deg, #6c757d, #868e96);
            color: white;
        }

        /* Tables */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }

        .data-table th, .data-table td {
            padding: 0.8rem;
            text-align: left;
            border-bottom: 1px solid #d4af37;
        }

        .data-table th {
            background: linear-gradient(135deg, #1a365d, #2c5f41);
            color: #d4af37;
            font-weight: bold;
        }

        .data-table tr:hover {
            background: rgba(212, 175, 55, 0.1);
        }

        /* Responsive */
        @media (max-width: 1200px) {
            .dashboard-container {
                grid-template-columns: 1fr;
            }
        }

        function editEmployee(employeeId) {
            const employee = db.employees.find(e => e.id === employeeId);
            if (employee) {
                // Pre-fill the form with employee data
                document.getElementById('empName').value = employee.name;
                document.getElementById('empEmail').value = employee.email;
                document.getElementById('empRole').value = employee.role;
                document.getElementById('empPhone').value = employee.phone || '';
                
                // Store the ID for updating
                document.getElementById('empName').dataset.editId = employeeId;
                
                openModal('addEmployeeModal');
                showNotification('Modifica i dati e salva', 'info');
            }
        }

        function deleteEmployee(employeeId) {
            if (confirm('Sei sicuro di voler eliminare questo dipendente?')) {
                db.employees = db.employees.filter(e => e.id !== employeeId);
                db.save();
                showNotification('Dipendente eliminato', 'success');
                loadEmployeesTable();
                updateEmployeeList();
                updateEmployeeSelect();
            }
        }

        function saveSettings() {
            const settings = {
                companyName: document.getElementById('companyName').value,
                timezone: document.getElementById('timezone').value,
                timeFormat: document.getElementById('timeFormat').value,
                gpsRadius: parseInt(document.getElementById('gpsRadius').value),
                officeCoords: document.getElementById('officeCoords').value,
                requireGPS: document.getElementById('requireGPS').checked
            };
            
            db.settings = settings;
            db.save();
            showNotification('Impostazioni salvate', 'success');
        }

        function resetSettings() {
            if (confirm('Ripristinare le impostazioni predefinite?')) {
                db.settings = {};
                db.save();
                loadSettings();
                showNotification('Impostazioni ripristinate', 'info');
            }
        }

        // Export functions
        function exportEmployees() {
            const csvContent = generateCSV(db.employees, [
                { key: 'name', label: 'Nome' },
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Ruolo' },
                { key: 'group', label: 'Gruppo' },
                { key: 'phone', label: 'Telefono' },
                { key: 'status', label: 'Stato' }
            ]);
            
            downloadFile(csvContent, 'dipendenti.csv', 'text/csv');
            showNotification('Export dipendenti completato', 'success');
        }

        function exportReport() {
            // Generate PDF report (simplified - in a real app you'd use a PDF library)
            const reportData = collectReportData();
            const pdfContent = generatePDFContent(reportData);
            
            downloadFile(pdfContent, 'report_presenze.txt', 'text/plain');
            showNotification('Export PDF completato', 'success');
        }

        function exportReportExcel() {
            const reportData = collectReportData();
            const csvContent = generateCSV(reportData, [
                { key: 'date', label: 'Data' },
                { key: 'employee', label: 'Dipendente' },
                { key: 'timeIn', label: 'Entrata' },
                { key: 'timeOut', label: 'Uscita' },
                { key: 'hours', label: 'Ore' },
                { key: 'method', label: 'Metodo' },
                { key: 'location', label: 'Posizione' }
            ]);
            
            downloadFile(csvContent, 'report_presenze.csv', 'text/csv');
            showNotification('Export Excel completato', 'success');
        }

        function exportAllData() {
            const allData = {
                employees: db.employees,
                punches: db.punches,
                groups: db.groups,
                requests: db.requests,
                settings: db.settings,
                clients: db.clients,
                projects: db.projects,
                exportDate: new Date().toISOString()
            };
            
            const jsonContent = JSON.stringify(allData, null, 2);
            downloadFile(jsonContent, 'goldentimepro_backup.json', 'application/json');
            showNotification('Backup completo esportato', 'success');
        }

        function importData() {
            document.getElementById('importFile').click();
        }

        function handleImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (confirm('Importare i dati? Questo sovrascriverà tutti i dati esistenti.')) {
                        db.employees = importedData.employees || [];
                        db.punches = importedData.punches || [];
                        db.groups = importedData.groups || [];
                        db.requests = importedData.requests || [];
                        db.settings = importedData.settings || {};
                        db.clients = importedData.clients || [];
                        db.projects = importedData.projects || [];
                        
                        db.save();
                        showNotification('Dati importati con successo', 'success');
                        
                        // Refresh current section
                        showSection(currentSection);
                    }
                } catch (error) {
                    showNotification('Errore nell\'importazione dati', 'error');
                }
            };
            reader.readAsText(file);
        }

        // Admin functions
        function manageUsers() {
            showSection('employees');
        }

        function viewAllPunches() {
            showSection('reports');
            // Set date range to show all data
            document.getElementById('reportFromDate').value = '2024-01-01';
            document.getElementById('reportToDate').value = new Date().toISOString().split('T')[0];
            generateReport();
        }

        function cleanupData() {
            if (confirm('Eliminare i dati più vecchi di 6 mesi?')) {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                
                const originalCount = db.punches.length;
                db.punches = db.punches.filter(p => new Date(p.timestamp) > sixMonthsAgo);
                db.save();
                
                const deletedCount = originalCount - db.punches.length;
                showNotification(`${deletedCount} timbrature vecchie eliminate`, 'success');
                loadAdmin();
            }
        }

        // Utility functions
        function generateCSV(data, columns) {
            const headers = columns.map(col => col.label).join(',');
            const rows = data.map(item => 
                columns.map(col => {
                    const value = item[col.key] || '';
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }).join(',')
            );
            
            return [headers, ...rows].join('\n');
        }

        function collectReportData() {
            const tbody = document.getElementById('reportTableBody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            return rows.map(row => {
                const cells = row.querySelectorAll('td');
                return {
                    date: cells[0]?.textContent || '',
                    employee: cells[1]?.textContent || '',
                    timeIn: cells[2]?.textContent || '',
                    timeOut: cells[3]?.textContent || '',
                    hours: cells[4]?.textContent || '',
                    method: cells[5]?.textContent || '',
                    location: cells[6]?.textContent || ''
                };
            });
        }

        function generatePDFContent(data) {
            let content = `GOLDENTIMEPRO - REPORT PRESENZE\n`;
            content += `Generato il: ${new Date().toLocaleDateString('it-IT')}\n\n`;
            content += `${'='.repeat(80)}\n\n`;
            
            data.forEach(row => {
                content += `Data: ${row.date}\n`;
                content += `Dipendente: ${row.employee}\n`;
                content += `Entrata: ${row.timeIn} | Uscita: ${row.timeOut}\n`;
                content += `Ore lavorate: ${row.hours}\n`;
                content += `Metodo: ${row.method} | Posizione: ${row.location}\n`;
                content += `${'-'.repeat(40)}\n`;
            });
            
            return content;
        }

        function downloadFile(content, filename, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Notification system
        function showNotification(message, type) {
            const notification = document.createElement('div');
            const colors = {
                success: 'linear-gradient(45deg, #d4af37, #ffd700)',
                error: 'linear-gradient(45deg, #dc3545, #c82333)',
                info: 'linear-gradient(45deg, #1a365d, #2c5f41)'
            };
            
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${colors[type] || colors.info};
                color: ${type === 'success' ? '#1a365d' : 'white'};
                padding: 1rem 2rem;
                border-radius: 50px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                z-index: 10000;
                font-weight: bold;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 300px;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 4000);
        }

        // WebHook integration for N8N
        function sendToN8N(data) {
            // This function would send data to your N8N webhook
            // Replace with your actual N8N webhook URL
            const webhookUrl = 'https://your-n8n-instance.com/webhook/goldentimepro';
            
            if (webhookUrl.includes('your-n8n-instance.com')) {
                // Demo mode - just log the data
                console.log('N8N Webhook Data:', data);
                return;
            }
            
            fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                console.log('N8N Response:', result);
            })
            .catch(error => {
                console.error('N8N Error:', error);
            });
        }

        // Override the processPunch function to include N8N integration
        const originalProcessPunch = processPunch;
        
        processPunch = function(type, location) {
            const employee = db.employees.find(e => e.id === selectedEmployee);
            
            // Call original function
            originalProcessPunch(type, location);
            
            // Send to N8N
            const webhookData = {
                timestamp: new Date().toISOString(),
                employeeId: selectedEmployee,
                employeeName: employee.name,
                employeeEmail: employee.email,
                punchType: type,
                method: selectedMethod,
                location: location,
                companyName: db.settings.companyName || 'GoldenTime Pro'
            };
            
            sendToN8N(webhookData);
        };

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            // Set initial dates
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('reportFromDate').value = today;
            document.getElementById('reportToDate').value = today;
            document.getElementById('reqFromDate').value = today;
            document.getElementById('reqToDate').value = today;
            
            // Load dashboard by default
            showSection('dashboard');
            
            // Start time updates
            updateTime();
            setInterval(updateTime, 1000);
            
            // Close modals when clicking outside
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            });
            
            // Initialize GPS method as default
            selectMethod('gps');
            
            console.log('GoldenTime Pro inizializzato con successo!');
            console.log('Database employees:', db.employees.length);
            console.log('Database punches:', db.punches.length);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + Number for quick navigation
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
                e.preventDefault();
                const sections = ['dashboard', 'employees', 'reports', 'requests', 'settings', 'admin'];
                const index = parseInt(e.key) - 1;
                if (sections[index]) {
                    showSection(sections[index]);
                }
            }
            
            // ESC to close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });

        // Auto-save functionality
        setInterval(() => {
            // Auto-update statistics every 30 seconds
            if (currentSection === 'dashboard') {
                updateStats();
            }
        }, 30000);

        // Simulate real-time updates (in a real app, this would come from server)
        setInterval(() => {
            // Randomly update employee status for demo
            if (Math.random() > 0.8) {
                const randomEmployee = db.employees[Math.floor(Math.random() * db.employees.length)];
                if (randomEmployee && !randomEmployee.clockedIn) {
                    randomEmployee.status = randomEmployee.status === 'online' ? 'offline' : 'online';
                    db.save();
                    
                    if (currentSection === 'dashboard') {
                        updateEmployeeList();
                    }
                }
            }
        }, 15000);
        
    </script>
</body>
</html>

        @media (max-width: 768px) {
            .nav-links {
                display: none;
            }
            
            .hero h1 {
                font-size: 2rem;
            }
            
            .tracking-methods {
                grid-template-columns: 1fr;
            }
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
        }

        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            border: 3px solid #d4af37;
        }

        .close-modal {
            float: right;
            font-size: 2rem;
            cursor: pointer;
            color: #1a365d;
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="container nav">
            <div class="logo">
                <i data-feather="clock"></i>
                GoldenTime Pro
            </div>
            <ul class="nav-links">
                <li><a onclick="showSection('dashboard')">Dashboard</a></li>
                <li><a onclick="showSection('employees')">Dipendenti</a></li>
                <li><a onclick="showSection('reports')">Report</a></li>
                <li><a onclick="showSection('requests')">Richieste</a></li>
                <li><a onclick="showSection('settings')">Impostazioni</a></li>
            </ul>
            <button class="admin-btn" onclick="showSection('admin')">Amministrazione</button>
        </nav>
    </header>

    <main class="main-content container">
        <!-- Dashboard Section -->
        <section id="dashboard" class="section active">
            <div class="hero">
                <h1>Dashboard GoldenTime Pro</h1>
                <p>Sistema completo di rilevazione presenze e gestione dipendenti</p>
            </div>

            <div class="dashboard-container">
                <!-- Left Panel - Employees -->
                <div class="panel">
                    <h3 class="panel-title">
                        <i data-feather="users"></i>
                        Dipendenti (<span id="onlineCount">0</span> online)
                    </h3>
                    <div class="employee-list" id="employeeList">
                        <!-- Populated by JavaScript -->
                    </div>
                    <button class="btn" onclick="openModal('addEmployeeModal')" style="width: 100%; margin-top: 1rem;">
                        <i data-feather="user-plus"></i> Aggiungi Dipendente
                    </button>
                </div>

                <!-- Main Panel - Time Clock -->
                <div class="panel main-panel">
                    <div class="time-clock">
                        <div class="current-time" id="currentTime">--:--:--</div>
                        <div class="current-date" id="currentDate">--</div>
                        <div style="margin: 1rem 0;">
                            <select id="employeeSelect" style="width: 100%; padding: 0.5rem; border-radius: 8px; border: 2px solid #d4af37;">
                                <option value="">Seleziona Dipendente</option>
                            </select>
                        </div>
                        <button class="clock-btn" id="clockBtn" onclick="toggleClock()" disabled>
                            Seleziona Dipendente
                        </button>
                    </div>

                    <h3 class="panel-title">
                        <i data-feather="smartphone"></i>
                        Metodi di Timbratura
                    </h3>
                    <div class="tracking-methods">
                        <div class="method-card" data-method="gps" onclick="selectMethod('gps')">
                            <i data-feather="map-pin"></i>
                            <h4>GPS</h4>
                            <p>Localizzazione</p>
                        </div>
                        <div class="method-card" data-method="nfc" onclick="selectMethod('nfc')">
                            <i data-feather="wifi"></i>
                            <h4>NFC Tag</h4>
                            <p>Tag NFC</p>
                        </div>
                        <div class="method-card" data-method="qr" onclick="selectMethod('qr')">
                            <i data-feather="maximize"></i>
                            <h4>QR Code</h4>
                            <p>Codice QR</p>
                        </div>
                        <div class="method-card" data-method="beacon" onclick="selectMethod('beacon')">
                            <i data-feather="radio"></i>
                            <h4>Beacon</h4>
                            <p>Bluetooth LE</p>
                        </div>
                    </div>

                    <h3 class="panel-title">
                        <i data-feather="activity"></i>
                        Attività Recenti
                    </h3>
                    <div id="recentActivity">
                        <!-- Populated by JavaScript -->
                    </div>
                </div>

                <!-- Right Panel - Statistics -->
                <div class="panel">
                    <h3 class="panel-title">
                        <i data-feather="bar-chart"></i>
                        Statistiche
                    </h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number" id="totalEmployees">0</div>
                            <div>Dipendenti Totali</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="todayHours">0</div>
                            <div>Ore Oggi</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="monthHours">0</div>
                            <div>Ore Mese</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="activeProjects">0</div>
                            <div>Progetti Attivi</div>
                        </div>
                    </div>

                    <h3 class="panel-title" style="margin-top: 2rem;">
                        <i data-feather="map-pin"></i>
                        Gruppi/Filiali
                    </h3>
                    <div id="groupsList">
                        <!-- Populated by JavaScript -->
                    </div>
                    <button class="btn" onclick="openModal('addGroupModal')" style="width: 100%; margin-top: 1rem;">
                        <i data-feather="plus"></i> Aggiungi Gruppo
                    </button>
                </div>
            </div>
        </section>

        <!-- Employees Section -->
        <section id="employees" class="form-section">
            <h2 style="color: #1a365d; margin-bottom: 2rem;">
                <i data-feather="users"></i> Gestione Dipendenti
            </h2>
            <div style="margin-bottom: 2rem;">
                <button class="btn" onclick="openModal('addEmployeeModal')">
                    <i data-feather="user-plus"></i> Nuovo Dipendente
                </button>
                <button class="btn btn-secondary" onclick="exportEmployees()" style="margin-left: 1rem;">
                    <i data-feather="download"></i> Esporta Excel
                </button>
            </div>
            <table class="data-table" id="employeesTable">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Ruolo</th>
                        <th>Gruppo</th>
                        <th>Stato</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody id="employeesTableBody">
                    <!-- Populated by JavaScript -->
                </tbody>
            </table>
        </section>

        <!-- Reports Section -->
        <section id="reports" class="form-section">
            <h2 style="color: #1a365d; margin-bottom: 2rem;">
                <i data-feather="file-text"></i> Report e Timbrature
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div class="form-group">
                    <label>Da Data:</label>
                    <input type="date" id="reportFromDate">
                </div>
                <div class="form-group">
                    <label>A Data:</label>
                    <input type="date" id="reportToDate">
                </div>
                <div class="form-group">
                    <label>Dipendente:</label>
                    <select id="reportEmployee">
                        <option value="">Tutti i dipendenti</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Gruppo:</label>
                    <select id="reportGroup">
                        <option value="">Tutti i gruppi</option>
                    </select>
                </div>
            </div>
            <div style="margin-bottom: 2rem;">
                <button class="btn" onclick="generateReport()">
                    <i data-feather="search"></i> Genera Report
                </button>
                <button class="btn btn-secondary" onclick="exportReport()" style="margin-left: 1rem;">
                    <i data-feather="download"></i> Esporta PDF
                </button>
                <button class="btn btn-secondary" onclick="exportReportExcel()" style="margin-left: 1rem;">
                    <i data-feather="file"></i> Esporta Excel
                </button>
            </div>
            <table class="data-table" id="reportTable">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Dipendente</th>
                        <th>Entrata</th>
                        <th>Uscita</th>
                        <th>Ore Lavorate</th>
                        <th>Metodo</th>
                        <th>Posizione</th>
                    </tr>
                </thead>
                <tbody id="reportTableBody">
                    <!-- Populated by JavaScript -->
                </tbody>
            </table>
        </section>

        <!-- Requests Section -->
        <section id="requests" class="form-section">
            <h2 style="color: #1a365d; margin-bottom: 2rem;">
                <i data-feather="inbox"></i> Richieste Permessi
            </h2>
            <div style="margin-bottom: 2rem;">
                <button class="btn" onclick="openModal('addRequestModal')">
                    <i data-feather="plus"></i> Nuova Richiesta
                </button>
            </div>
            <table class="data-table" id="requestsTable">
                <thead>
                    <tr>
                        <th>Data Richiesta</th>
                        <th>Dipendente</th>
                        <th>Tipo</th>
                        <th>Dal</th>
                        <th>Al</th>
                        <th>Motivo</th>
                        <th>Stato</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody id="requestsTableBody">
                    <!-- Populated by JavaScript -->
                </tbody>
            </table>
        </section>

        <!-- Settings Section -->
        <section id="settings" class="form-section">
            <h2 style="color: #1a365d; margin-bottom: 2rem;">
                <i data-feather="settings"></i> Impostazioni Sistema
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                <div>
                    <h3 style="color: #2c5f41; margin-bottom: 1rem;">Impostazioni Generali</h3>
                    <div class="form-group">
                        <label>Nome Azienda:</label>
                        <input type="text" id="companyName" value="GoldenTime Pro">
                    </div>
                    <div class="form-group">
                        <label>Fuso Orario:</label>
                        <select id="timezone">
                            <option value="Europe/Rome">Europa/Roma</option>
                            <option value="Europe/London">Europa/Londra</option>
                            <option value="America/New_York">America/New York</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Formato Ora:</label>
                        <select id="timeFormat">
                            <option value="24">24 ore</option>
                            <option value="12">12 ore (AM/PM)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <h3 style="color: #2c5f41; margin-bottom: 1rem;">Geolocalizzazione</h3>
                    <div class="form-group">
                        <label>Raggio GPS (metri):</label>
                        <input type="number" id="gpsRadius" value="100" min="10" max="1000">
                    </div>
                    <div class="form-group">
                        <label>Coordinate Ufficio (Lat, Lng):</label>
                        <input type="text" id="officeCoords" value="45.4642, 9.1900" placeholder="45.4642, 9.1900">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="requireGPS" checked> Richiedi GPS per timbrature
                        </label>
                    </div>
                </div>
            </div>
            <div style="margin-top: 2rem;">
                <button class="btn" onclick="saveSettings()">
                    <i data-feather="save"></i> Salva Impostazioni
                </button>
                <button class="btn btn-secondary" onclick="resetSettings()" style="margin-left: 1rem;">
                    <i data-feather="refresh-cw"></i> Reset Default
                </button>
            </div>
        </section>

        <!-- Admin Section -->
        <section id="admin" class="form-section">
            <h2 style="color: #1a365d; margin-bottom: 2rem;">
                <i data-feather="shield"></i> Pannello Amministratore
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
                <div class="stat-card">
                    <div class="stat-number" id="adminTotalUsers">0</div>
                    <div>Utenti Totali</div>
                    <button class="btn" onclick="manageUsers()" style="margin-top: 1rem; width: 100%;">Gestisci</button>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="adminTotalPunches">0</div>
                    <div>Timbrature Totali</div>
                    <button class="btn" onclick="viewAllPunches()" style="margin-top: 1rem; width: 100%;">Visualizza</button>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="adminStorageUsed">0</div>
                    <div>MB Utilizzati</div>
                    <button class="btn" onclick="cleanupData()" style="margin-top: 1rem; width: 100%;">Pulizia</button>
                </div>
            </div>
            <div style="margin-top: 2rem;">
                <h3 style="color: #2c5f41; margin-bottom: 1rem;">Backup e Ripristino</h3>
                <button class="btn" onclick="exportAllData()">
                    <i data-feather="download"></i> Esporta Tutti i Dati
                </button>
                <button class="btn btn-secondary" onclick="importData()" style="margin-left: 1rem;">
                    <i data-feather="upload"></i> Importa Dati
                </button>
                <input type="file" id="importFile" accept=".json" style="display: none;" onchange="handleImport(event)">
            </div>
        </section>
    </main>

    <!-- Modals -->
    <div id="addEmployeeModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('addEmployeeModal')">&times;</span>
            <h3 style="color: #1a365d; margin-bottom: 1rem;">Aggiungi Dipendente</h3>
            <form onsubmit="addEmployee(event)">
                <div class="form-group">
                    <label>Nome Completo:</label>
                    <input type="text" id="empName" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="empEmail" required>
                </div>
                <div class="form-group">
                    <label>Ruolo:</label>
                    <input type="text" id="empRole" required>
                </div>
                <div class="form-group">
                    <label>Gruppo:</label>
                    <select id="empGroup">
                        <option value="">Nessun gruppo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Telefono:</label>
                    <input type="tel" id="empPhone">
                </div>
                <button type="submit" class="btn">Aggiungi Dipendente</button>
            </form>
        </div>
    </div>

    <div id="addGroupModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('addGroupModal')">&times;</span>
            <h3 style="color: #1a365d; margin-bottom: 1rem;">Aggiungi Gruppo/Filiale</h3>
            <form onsubmit="addGroup(event)">
                <div class="form-group">
                    <label>Nome Gruppo:</label>
                    <input type="text" id="groupName" required>
                </div>
                <div class="form-group">
                    <label>Descrizione:</label>
                    <textarea id="groupDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Indirizzo:</label>
                    <input type="text" id="groupAddress">
                </div>
                <div class="form-group">
                    <label>Coordinate GPS:</label>
                    <input type="text" id="groupCoords" placeholder="45.4642, 9.1900">
                </div>
                <button type="submit" class="btn">Aggiungi Gruppo</button>
            </form>
        </div>
    </div>

    <div id="addRequestModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal('addRequestModal')">&times;</span>
            <h3 style="color: #1a365d; margin-bottom: 1rem;">Nuova Richiesta Permesso</h3>
            <form onsubmit="addRequest(event)">
                <div class="form-group">
                    <label>Dipendente:</label>
                    <select id="reqEmployee" required>
                        <option value="">Seleziona dipendente</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tipo Richiesta:</label>
                    <select id="reqType" required>
                        <option value="">Seleziona tipo</option>
                        <option value="ferie">Ferie</option>
                        <option value="malattia">Malattia</option>
                        <option value="permesso">Permesso</option>
                        <option value="congedo">Congedo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Data Inizio:</label>
                    <input type="date" id="reqFromDate" required>
                </div>
                <div class="form-group">
                    <label>Data Fine:</label>
                    <input type="date" id="reqToDate" required>
                </div>
                <div class="form-group">
                    <label>Motivo:</label>
                    <textarea id="reqReason" rows="3" required></textarea>
                </div>
                <button type="submit" class="btn">Invia Richiesta</button>
            </form>
        </div>
    </div>

    <script>
        // Initialize Feather icons
        feather.replace();

        // Database simulation using localStorage
        class GoldenTimeDB {
            constructor() {
                this.employees = JSON.parse(localStorage.getItem('gt_employees') || '[]');
                this.punches = JSON.parse(localStorage.getItem('gt_punches') || '[]');
                this.groups = JSON.parse(localStorage.getItem('gt_groups') || '[]');
                this.requests = JSON.parse(localStorage.getItem('gt_requests') || '[]');
                this.settings = JSON.parse(localStorage.getItem('gt_settings') || '{}');
                this.clients = JSON.parse(localStorage.getItem('gt_clients') || '[]');
                this.projects = JSON.parse(localStorage.getItem('gt_projects') || '[]');
                
                // Initialize with sample data if empty
                if (this.employees.length === 0) {
                    this.initSampleData();
                }
            }

            initSampleData() {
                this.employees = [
                    {
                        id: 1,
                        name: 'Marco Rossi',
                        email: 'marco.rossi@goldentimepro.com',
                        role: 'Sviluppatore Senior',
                        group: 'IT',
                        phone: '+39 123 456 7890',
                        status: 'online',
                        lastPunch: null,
                        clockedIn: false
                    },
                    {
                        id: 2,
                        name: 'Laura Bianchi',
                        email: 'laura.bianchi@goldentimepro.com',
                        role: 'UI/UX Designer',
                        group: 'Design',
                        phone: '+39 098 765 4321',
                        status: 'online',
                        lastPunch: null,
                        clockedIn: false
                    },
                    {
                        id: 3,
                        name: 'Giuseppe Verdi',
                        email: 'giuseppe.verdi@goldentimepro.com',
                        role: 'Project Manager',
                        group: 'Management',
                        phone: '+39 555 123 4567',
                        status: 'offline',
                        lastPunch: null,
                        clockedIn: false
                    }
                ];

                this.groups = [
                    {
                        id: 1,
                        name: 'IT',
                        description: 'Reparto Informatico',
                        address: 'Via Roma 123, Milano',
                        coords: '45.4642, 9.1900'
                    },
                    {
                        id: 2,
                        name: 'Design',
                        description: 'Reparto Creativo',
                        address: 'Via Garibaldi 456, Milano',
                        coords: '45.4643, 9.1901'
                    },
                    {
                        id: 3,
                        name: 'Management',
                        description: 'Direzione e Amministrazione',
                        address: 'Corso Buenos Aires 789, Milano',
                        coords: '45.4644, 9.1902'
                    }
                ];

                this.projects = [
                    { id: 1, name: 'Sistema CRM', status: 'active' },
                    { id: 2, name: 'App Mobile', status: 'active' },
                    { id: 3, name: 'Sito E-commerce', status: 'active' }
                ];

                this.save();
            }

            save() {
                localStorage.setItem('gt_employees', JSON.stringify(this.employees));
                localStorage.setItem('gt_punches', JSON.stringify(this.punches));
                localStorage.setItem('gt_groups', JSON.stringify(this.groups));
                localStorage.setItem('gt_requests', JSON.stringify(this.requests));
                localStorage.setItem('gt_settings', JSON.stringify(this.settings));
                localStorage.setItem('gt_clients', JSON.stringify(this.clients));
                localStorage.setItem('gt_projects', JSON.stringify(this.projects));
            }

            addEmployee(employee) {
                const id = Math.max(...this.employees.map(e => e.id), 0) + 1;
                employee.id = id;
                employee.status = 'offline';
                employee.clockedIn = false;
                employee.lastPunch = null;
                this.employees.push(employee);
                this.save();
                return employee;
            }

            addGroup(group) {
                const id = Math.max(...this.groups.map(g => g.id), 0) + 1;
                group.id = id;
                this.groups.push(group);
                this.save();
                return group;
            }

            addPunch(punch) {
                const id = Math.max(...this.punches.map(p => p.id), 0) + 1;
                punch.id = id;
                punch.timestamp = new Date().toISOString();
                this.punches.push(punch);
                
                // Update employee status
                const employee = this.employees.find(e => e.id === punch.employeeId);
                if (employee) {
                    employee.clockedIn = punch.type === 'in';
                    employee.lastPunch = punch.timestamp;
                    employee.status = punch.type === 'in' ? 'online' : 'offline';
                }
                
                this.save();
                return punch;
            }

            addRequest(request) {
                const id = Math.max(...this.requests.map(r => r.id), 0) + 1;
                request.id = id;
                request.timestamp = new Date().toISOString();
                request.status = 'pending';
                this.requests.push(request);
                this.save();
                return request;
            }

            getEmployeeHours(employeeId, fromDate, toDate) {
                const employeePunches = this.punches
                    .filter(p => p.employeeId === employeeId)
                    .filter(p => {
                        const punchDate = new Date(p.timestamp);
                        return punchDate >= new Date(fromDate) && punchDate <= new Date(toDate);
                    })
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                let totalHours = 0;
                let currentEntry = null;

                employeePunches.forEach(punch => {
                    if (punch.type === 'in') {
                        currentEntry = punch;
                    } else if (punch.type === 'out' && currentEntry) {
                        const entryTime = new Date(currentEntry.timestamp);
                        const exitTime = new Date(punch.timestamp);
                        const hours = (exitTime - entryTime) / (1000 * 60 * 60);
                        totalHours += hours;
                        currentEntry = null;
                    }
                });

                return Math.round(totalHours * 100) / 100;
            }
        }

        // Initialize database
        const db = new GoldenTimeDB();

        // Global variables
        let currentSection = 'dashboard';
        let selectedMethod = 'gps';
        let selectedEmployee = null;

        // Time functions
        function updateTime() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('it-IT');
            const dateString = now.toLocaleDateString('it-IT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            document.getElementById('currentTime').textContent = timeString;
            document.getElementById('currentDate').textContent = dateString;
        }

        // Navigation
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.section, .form-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(sectionId).classList.add('active');
            currentSection = sectionId;
            
            // Load section data
            switch(sectionId) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'employees':
                    loadEmployeesTable();
                    break;
                case 'reports':
                    loadReports();
                    break;
                case 'requests':
                    loadRequests();
                    break;
                case 'settings':
                    loadSettings();
                    break;
                case 'admin':
                    loadAdmin();
                    break;
            }
        }

        // Dashboard functions
        function loadDashboard() {
            updateEmployeeList();
            updateStats();
            updateRecentActivity();
            updateGroupsList();
            updateEmployeeSelect();
        }

        function updateEmployeeList() {
            const container = document.getElementById('employeeList');
            const onlineCount = document.getElementById('onlineCount');
            
            let online = 0;
            container.innerHTML = '';
            
            db.employees.forEach(emp => {
                if (emp.status === 'online') online++;
                
                const item = document.createElement('div');
                item.className = 'employee-item';
                item.innerHTML = `
                    <div class="employee-info">
                        <h4>${emp.name}</h4>
                        <small>${emp.role}</small>
                    </div>
                    <span class="status-badge status-${emp.status}">
                        ${emp.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                `;
                container.appendChild(item);
            });
            
            onlineCount.textContent = online;
        }

        function updateEmployeeSelect() {
            const select = document.getElementById('employeeSelect');
            select.innerHTML = '<option value="">Seleziona Dipendente</option>';
            
            db.employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = emp.name;
                select.appendChild(option);
            });
            
            select.addEventListener('change', function() {
                selectedEmployee = this.value ? parseInt(this.value) : null;
                updateClockButton();
            });
        }

        function updateClockButton() {
            const btn = document.getElementById('clockBtn');
            
            if (!selectedEmployee) {
                btn.textContent = 'Seleziona Dipendente';
                btn.disabled = true;
                btn.classList.remove('clocked-in');
                return;
            }
            
            const employee = db.employees.find(e => e.id === selectedEmployee);
            if (employee) {
                btn.disabled = false;
                if (employee.clockedIn) {
                    btn.textContent = 'Timbratura Uscita';
                    btn.classList.add('clocked-in');
                } else {
                    btn.textContent = 'Timbratura Entrata';
                    btn.classList.remove('clocked-in');
                }
            }
        }

        function updateStats() {
            document.getElementById('totalEmployees').textContent = db.employees.length;
            document.getElementById('activeProjects').textContent = db.projects.filter(p => p.status === 'active').length;
            
            // Calculate today's hours
            const today = new Date().toISOString().split('T')[0];
            let todayHours = 0;
            db.employees.forEach(emp => {
                todayHours += db.getEmployeeHours(emp.id, today, today);
            });
            document.getElementById('todayHours').textContent = Math.round(todayHours);
            
            // Calculate month's hours
            const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
            let monthHours = 0;
            db.employees.forEach(emp => {
                monthHours += db.getEmployeeHours(emp.id, firstDay, lastDay);
            });
            document.getElementById('monthHours').textContent = Math.round(monthHours);
        }

        function updateRecentActivity() {
            const container = document.getElementById('recentActivity');
            const recentPunches = db.punches
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5);
            
            container.innerHTML = '';
            
            recentPunches.forEach(punch => {
                const employee = db.employees.find(e => e.id === punch.employeeId);
                const time = new Date(punch.timestamp).toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.innerHTML = `
                    <span>Timbratura ${punch.type === 'in' ? 'entrata' : 'uscita'} - ${employee ? employee.name : 'N/A'}</span>
                    <span>${time}</span>
                `;
                container.appendChild(item);
            });
        }

        function updateGroupsList() {
            const container = document.getElementById('groupsList');
            container.innerHTML = '';
            
            db.groups.forEach(group => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.innerHTML = `
                    <div>
                        <strong>${group.name}</strong><br>
                        <small>${group.description}</small>
                    </div>
                    <small>${db.employees.filter(e => e.group === group.name).length} dip.</small>
                `;
                container.appendChild(item);
            });
        }

        // Clock functions
        function selectMethod(method) {
            // Remove active class from all methods
            document.querySelectorAll('.method-card').forEach(card => {
                card.classList.remove('active');
            });
            
            // Add active class to selected method
            document.querySelector(`[data-method="${method}"]`).classList.add('active');
            selectedMethod = method;
            
            showNotification(`Metodo ${method.toUpperCase()} selezionato`, 'info');
        }

        function toggleClock() {
            if (!selectedEmployee) {
                showNotification('Seleziona un dipendente', 'error');
                return;
            }
            
            const employee = db.employees.find(e => e.id === selectedEmployee);
            const punchType = employee.clockedIn ? 'out' : 'in';
            
            // Get current location for GPS method
            if (selectedMethod === 'gps') {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const location = `${position.coords.latitude}, ${position.coords.longitude}`;
                            processPunch(punchType, location);
                        },
                        (error) => {
                            processPunch(punchType, 'Posizione non disponibile');
                        }
                    );
                } else {
                    processPunch(punchType, 'GPS non supportato');
                }
            } else {
                processPunch(punchType, `${selectedMethod.toUpperCase()} Location`);
            }
        }

        function processPunch(type, location) {
            const punch = {
                employeeId: selectedEmployee,
                type: type,
                method: selectedMethod,
                location: location
            };
            
            db.addPunch(punch);
            
            const employee = db.employees.find(e => e.id === selectedEmployee);
            const message = `Timbratura ${type === 'in' ? 'entrata' : 'uscita'} registrata per ${employee.name}`;
            
            showNotification(message, 'success');
            updateClockButton();
            updateEmployeeList();
            updateRecentActivity();
            updateStats();
        }

        // Modal functions
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
            
            // Populate selects if needed
            if (modalId === 'addEmployeeModal' || modalId === 'addRequestModal') {
                populateGroupSelects();
                populateEmployeeSelects();
            }
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function populateGroupSelects() {
            const selects = document.querySelectorAll('#empGroup, #reportGroup');
            selects.forEach(select => {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Nessun gruppo</option>';
                db.groups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.name;
                    option.textContent = group.name;
                    select.appendChild(option);
                });
                select.value = currentValue;
            });
        }

        function populateEmployeeSelects() {
            const selects = document.querySelectorAll('#reqEmployee, #reportEmployee');
            selects.forEach(select => {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Seleziona dipendente</option>';
                db.employees.forEach(emp => {
                    const option = document.createElement('option');
                    option.value = emp.id;
                    option.textContent = emp.name;
                    select.appendChild(option);
                });
                select.value = currentValue;
            });
        }

        // Form functions
        function addEmployee(event) {
            event.preventDefault();
            
            const employee = {
                name: document.getElementById('empName').value,
                email: document.getElementById('empEmail').value,
                role: document.getElementById('empRole').value,
                group: document.getElementById('empGroup').value,
                phone: document.getElementById('empPhone').value
            };
            
            db.addEmployee(employee);
            closeModal('addEmployeeModal');
            showNotification('Dipendente aggiunto con successo', 'success');
            
            // Reset form
            event.target.reset();
            
            // Update UI
            if (currentSection === 'dashboard') {
                loadDashboard();
            } else if (currentSection === 'employees') {
                loadEmployeesTable();
            }
        }

        function addGroup(event) {
            event.preventDefault();
            
            const group = {
                name: document.getElementById('groupName').value,
                description: document.getElementById('groupDescription').value,
                address: document.getElementById('groupAddress').value,
                coords: document.getElementById('groupCoords').value
            };
            
            db.addGroup(group);
            closeModal('addGroupModal');
            showNotification('Gruppo aggiunto con successo', 'success');
            
            // Reset form
            event.target.reset();
            
            // Update UI
            updateGroupsList();
            populateGroupSelects();
        }

        function addRequest(event) {
            event.preventDefault();
            
            const request = {
                employeeId: parseInt(document.getElementById('reqEmployee').value),
                type: document.getElementById('reqType').value,
                fromDate: document.getElementById('reqFromDate').value,
                toDate: document.getElementById('reqToDate').value,
                reason: document.getElementById('reqReason').value
            };
            
            db.addRequest(request);
            closeModal('addRequestModal');
            showNotification('Richiesta inviata con successo', 'success');
            
            // Reset form
            event.target.reset();
            
            // Update UI
            if (currentSection === 'requests') {
                loadRequests();
            }
        }

        // Load sections
        function loadEmployeesTable() {
            const tbody = document.getElementById('employeesTableBody');
            tbody.innerHTML = '';
            
            db.employees.forEach(emp => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${emp.name}</td>
                    <td>${emp.email}</td>
                    <td>${emp.role}</td>
                    <td>${emp.group || 'Nessuno'}</td>
                    <td><span class="status-badge status-${emp.status}">${emp.status === 'online' ? 'Online' : 'Offline'}</span></td>
                    <td>
                        <button class="btn" onclick="editEmployee(${emp.id})" style="padding: 0.3rem 1rem; font-size: 0.8rem;">Modifica</button>
                        <button class="btn btn-secondary" onclick="deleteEmployee(${emp.id})" style="padding: 0.3rem 1rem; font-size: 0.8rem; margin-left: 0.5rem;">Elimina</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function loadReports() {
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            
            document.getElementById('reportFromDate').value = firstDay;
            document.getElementById('reportToDate').value = today;
            
            populateEmployeeSelects();
            populateGroupSelects();
        }

        function generateReport() {
            const fromDate = document.getElementById('reportFromDate').value;
            const toDate = document.getElementById('reportToDate').value;
            const employeeId = document.getElementById('reportEmployee').value;
            const group = document.getElementById('reportGroup').value;
            
            let filteredPunches = db.punches.filter(punch => {
                const punchDate = new Date(punch.timestamp).toISOString().split('T')[0];
                return punchDate >= fromDate && punchDate <= toDate;
            });
            
            if (employeeId) {
                filteredPunches = filteredPunches.filter(p => p.employeeId === parseInt(employeeId));
            }
            
            if (group) {
                const groupEmployees = db.employees.filter(e => e.group === group).map(e => e.id);
                filteredPunches = filteredPunches.filter(p => groupEmployees.includes(p.employeeId));
            }
            
            const tbody = document.getElementById('reportTableBody');
            tbody.innerHTML = '';
            
            // Group punches by employee and date
            const groupedPunches = {};
            filteredPunches.forEach(punch => {
                const date = new Date(punch.timestamp).toISOString().split('T')[0];
                const key = `${punch.employeeId}-${date}`;
                
                if (!groupedPunches[key]) {
                    groupedPunches[key] = {
                        employeeId: punch.employeeId,
                        date: date,
                        punches: []
                    };
                }
                groupedPunches[key].punches.push(punch);
            });
            
            Object.values(groupedPunches).forEach(group => {
                const employee = db.employees.find(e => e.id === group.employeeId);
                const inPunch = group.punches.find(p => p.type === 'in');
                const outPunch = group.punches.find(p => p.type === 'out');
                
                let hoursWorked = 0;
                if (inPunch && outPunch) {
                    const inTime = new Date(inPunch.timestamp);
                    const outTime = new Date(outPunch.timestamp);
                    hoursWorked = Math.round((outTime - inTime) / (1000 * 60 * 60) * 100) / 100;
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(group.date).toLocaleDateString('it-IT')}</td>
                    <td>${employee ? employee.name : 'N/A'}</td>
                    <td>${inPunch ? new Date(inPunch.timestamp).toLocaleTimeString('it-IT') : '-'}</td>
                    <td>${outPunch ? new Date(outPunch.timestamp).toLocaleTimeString('it-IT') : '-'}</td>
                    <td>${hoursWorked > 0 ? hoursWorked + 'h' : '-'}</td>
                    <td>${inPunch ? inPunch.method.toUpperCase() : '-'}</td>
                    <td>${inPunch ? inPunch.location : '-'}</td>
                `;
                tbody.appendChild(row);
            });
        }

        function loadRequests() {
            const tbody = document.getElementById('requestsTableBody');
            tbody.innerHTML = '';
            
            db.requests.forEach(req => {
                const employee = db.employees.find(e => e.id === req.employeeId);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(req.timestamp).toLocaleDateString('it-IT')}</td>
                    <td>${employee ? employee.name : 'N/A'}</td>
                    <td>${req.type}</td>
                    <td>${new Date(req.fromDate).toLocaleDateString('it-IT')}</td>
                    <td>${new Date(req.toDate).toLocaleDateString('it-IT')}</td>
                    <td>${req.reason}</td>
                    <td><span class="status-badge status-${req.status === 'approved' ? 'online' : req.status === 'rejected' ? 'offline' : 'offline'}">${req.status}</span></td>
                    <td>
                        ${req.status === 'pending' ? `
                            <button class="btn" onclick="approveRequest(${req.id})" style="padding: 0.3rem 1rem; font-size: 0.8rem;">Approva</button>
                            <button class="btn btn-secondary" onclick="rejectRequest(${req.id})" style="padding: 0.3rem 1rem; font-size: 0.8rem; margin-left: 0.5rem;">Rifiuta</button>
                        ` : '-'}
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function loadSettings() {
            // Load current settings from database
            const settings = db.settings;
            
            document.getElementById('companyName').value = settings.companyName || 'GoldenTime Pro';
            document.getElementById('timezone').value = settings.timezone || 'Europe/Rome';
            document.getElementById('timeFormat').value = settings.timeFormat || '24';
            document.getElementById('gpsRadius').value = settings.gpsRadius || '100';
            document.getElementById('officeCoords').value = settings.officeCoords || '45.4642, 9.1900';
            document.getElementById('requireGPS').checked = settings.requireGPS !== false;
        }

        function loadAdmin() {
            document.getElementById('adminTotalUsers').textContent = db.employees.length;
            document.getElementById('adminTotalPunches').textContent = db.punches.length;
            
            // Calculate storage usage (rough estimate)
            const dataSize = JSON.stringify(db).length;
            const sizeInMB = Math.round(dataSize / 1024 / 1024 * 100) / 100;
            document.getElementById('adminStorageUsed').textContent = sizeInMB;
        }

        // Utility functions
        function approveRequest(requestId) {
            const request = db.requests.find(r => r.id === requestId);
            if (request) {
                request.status = 'approved';
                db.save();
                showNotification('Richiesta approvata', 'success');
                loadRequests();
            }
        }

        function rejectRequest(requestId) {
            const request = db.requests.find(r => r.id === requestId);
            if (request) {
                request.status = 'rejected';
                db.save();
                showNotification('Richiesta rifiutata', 'info');
                loadRequests();
