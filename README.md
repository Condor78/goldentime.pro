<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Timbrature Dipendenti</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* INCOLLA QUI il tuo CSS personalizzato */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🕐 GoldenTime Pro</h1>
      <p>Sistema Timbrature Collegato a n8n</p>
    </div>

    <div class="mode-switcher">
      <h3>Modalità Dipendente</h3>
    </div>

    <div class="section active">
      <h2>👥 Dipendenti</h2>
      <div class="employee-grid" id="employeeGrid"></div>
    </div>
  </div>

  <script>
    // ✅ INSERISCI QUI il tuo webhook n8n
    const N8N_WEBHOOK_URL = "https://TUA-N8N-URL/webhook/timbratura";

    // Dipendenti statici (modifica liberamente)
    const employees = [
      { id: 1, matricola: "EMP001", name: "Mario Rossi", role: "Magazziniere", clockedIn: false },
      { id: 2, matricola: "EMP002", name: "Laura Bianchi", role: "Contabile", clockedIn: false },
      { id: 3, matricola: "EMP003", name: "Giuseppe Verdi", role: "Tecnico", clockedIn: false }
    ];

    // Carica griglia iniziale
    function loadEmployeeGrid() {
      const grid = document.getElementById('employeeGrid');
      grid.innerHTML = '';
      employees.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.onclick = () => togglePunch(emp.id);
        card.innerHTML = `
          <div class="employee-name">${emp.name}</div>
          <div class="employee-details">${emp.role}</div>
          <div class="employee-details">Matricola: ${emp.matricola}</div>
          <div class="status-badge ${emp.clockedIn ? 'status-in' : 'status-out'}">
            ${emp.clockedIn ? 'IN SERVIZIO' : 'FUORI SERVIZIO'}
          </div>`;
        grid.appendChild(card);
      });
    }

    // Timbra e invia a n8n
    function togglePunch(employeeId) {
      const emp = employees.find(e => e.id === employeeId);
      if (!emp) return;

      emp.clockedIn = !emp.clockedIn;
      const tipo = emp.clockedIn ? "IN" : "OUT";
      const timestamp = new Date().toISOString();

      loadEmployeeGrid();
      showNotification(`${emp.name} ha timbrato ${tipo}`, 'success');

      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matricola: emp.matricola,
          nome: emp.name,
          tipo: tipo,
          timestamp: timestamp
        })
      }).catch(err => {
        console.error("Errore invio a n8n:", err);
        showNotification("Errore invio a n8n", 'error');
      });
    }

    // Notifica visuale
    function showNotification(msg, type) {
      const notif = document.createElement('div');
      notif.className = 'notification ' + type;
      notif.textContent = msg;
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 3000);
    }

    // Avvio
    loadEmployeeGrid();
  </script>
</body>
</html>
