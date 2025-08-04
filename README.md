<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>GoldenTime Pro - Importa da file CSV</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f2f2f2;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: auto;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .employee-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }
    .employee-card {
      background: white;
      border: 2px solid #d4af37;
      border-radius: 15px;
      padding: 15px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .employee-card:hover {
      transform: scale(1.02);
      background: #fff9e6;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      margin-top: 10px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 0.9rem;
    }
    .status-in {
      background: #28a745;
      color: white;
    }
    .status-out {
      background: #6c757d;
      color: white;
    }
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px;
      border-radius: 8px;
      background: #28a745;
      color: white;
      font-weight: bold;
      z-index: 9999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🕐 GoldenTime Pro</h1>
      <p>Importazione da file CSV funzionante</p>
    </div>

    <h3>👥 Dipendenti</h3>
    <div class="employee-grid" id="employeeGrid"></div>

    <h3 style="margin-top:40px;">📤 Carica file CSV</h3>
    <input type="file" id="csvFile" accept=".csv">
  </div>

  <script>
    let employees = [
      { id: 1, matricola: "EMP001", name: "Mario Rossi", role: "Magazziniere", clockedIn: false },
      { id: 2, matricola: "EMP002", name: "Laura Bianchi", role: "Contabile", clockedIn: false }
    ];

    function loadEmployeeGrid() {
      const grid = document.getElementById('employeeGrid');
      grid.innerHTML = '';
      employees.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.onclick = () => togglePunch(emp.id);
        card.innerHTML = `
          <div><strong>${emp.name}</strong></div>
          <div>${emp.role}</div>
          <div class="status-badge ${emp.clockedIn ? 'status-in' : 'status-out'}">
            ${emp.clockedIn ? 'IN SERVIZIO' : 'FUORI SERVIZIO'}
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function togglePunch(id) {
      const emp = employees.find(e => e.id === id);
      if (!emp) return;
      emp.clockedIn = !emp.clockedIn;
      loadEmployeeGrid();
      showNotification(`${emp.name} ha timbrato ${emp.clockedIn ? 'ENTRATA' : 'USCITA'}`);
    }

    function importFromCSVFile(file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.trim().split('\n');
        let maxId = Math.max(0, ...employees.map(e => e.id));
        let importati = 0;

        lines.forEach(line => {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length !== 3) return;
          const [matricola, name, role] = parts;

          if (!matricola || !name || !role) return;

          const exists = employees.some(e => e.matricola.toUpperCase() === matricola.toUpperCase());
          if (exists) return;

          employees.push({
            id: ++maxId,
            matricola,
            name,
            role,
            clockedIn: false
          });
          importati++;
        });

        loadEmployeeGrid();
        showNotification(`✅ Importati ${importati} dipendenti`);
      };
      reader.readAsText(file);
    }

    document.getElementById("csvFile").addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        importFromCSVFile(file);
      }
    });

    function showNotification(msg, type = "success") {
      const div = document.createElement("div");
      div.className = "notification";
      if (type === "error") div.style.background = "#dc3545";
      div.textContent = msg;
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 3000);
    }

    loadEmployeeGrid();
  </script>
</body>
</html>
