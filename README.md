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
            max-width: 1200px;
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
        }

        .nav-links a:hover {
            color: #d4af37;
        }

        .cta-button {
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #1a365d;
            padding: 0.8rem 2rem;
            border: none;
            border-radius: 50px;
            font-weight: bold;
            text-decoration: none;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        }

        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
        }

        /* Main Content */
        .main-content {
            margin-top: 80px;
            padding: 4rem 0;
        }

        .hero {
            text-align: center;
            margin-bottom: 4rem;
            color: white;
        }

        .hero h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #d4af37, #ffd700);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .hero p {
            font-size: 1.3rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }

        /* Dashboard */
        .dashboard {
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            gap: 2rem;
            margin-bottom: 4rem;
        }

        .sidebar, .right-panel {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 2px solid #d4af37;
        }

        .main-panel {
            background: rgba(255, 255, 255, 0.98);
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
            border: 3px solid #d4af37;
        }

        .panel-title {
            color: #1a365d;
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .time-clock {
            background: linear-gradient(135deg, #1a365d, #2c5f41);
            color: white;
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            margin-bottom: 2rem;
        }

        .current-time {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: #d4af37;
        }

        .current-date {
            font-size: 1.2rem;
            opacity: 0.8;
        }

        .clock-in-btn {
            background: linear-gradient(45deg, #d4af37, #ffd700);
            color: #1a365d;
            border: none;
            padding: 1rem 3rem;
            border-radius: 50px;
            font-size: 1.2rem;
            font-weight: bold;
            cursor: pointer;
            margin-top: 1rem;
            transition: all 0.3s;
            box-shadow: 0 5px 20px rgba(212, 175, 55, 0.3);
        }

        .clock-in-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4);
        }

        .clock-in-btn.clocked-in {
            background: linear-gradient(45deg, #dc3545, #c82333);
            color: white;
        }

        .tracking-methods {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .method-card {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border: 2px solid #d4af37;
            border-radius: 10px;
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }

        .method-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2);
            background: linear-gradient(135deg, #d4af37, #ffd700);
            color: #1a365d;
        }

        .method-card i {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            color: #2c5f41;
        }

        .method-card:hover i {
            color: #1a365d;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
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

        .recent-activity {
            margin-top: 2rem;
        }

        .activity-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: linear-gradient(90deg, rgba(212, 175, 55, 0.1), rgba(44, 95, 65, 0.1));
            border-radius: 8px;
            margin-bottom: 0.5rem;
            border-left: 4px solid #d4af37;
        }

        .employee-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .employee-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: rgba(212, 175, 55, 0.1);
            border-radius: 8px;
            margin-bottom: 0.5rem;
            border: 1px solid #d4af37;
        }

        .status-badge {
            padding: 0.3rem 1rem;
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

        /* Pricing Section */
        .pricing-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 3rem;
            margin: 4rem 0;
            border: 3px solid #d4af37;
        }

        .pricing-title {
            text-align: center;
            color: #1a365d;
            font-size: 2.5rem;
            margin-bottom: 2rem;
        }

        .pricing-card {
            background: linear-gradient(135deg, #1a365d, #2c5f41);
            color: white;
            border-radius: 15px;
            padding: 2rem;
            border: 3px solid #d4af37;
            max-width: 500px;
            margin: 0 auto;
        }

        .plan-name {
            font-size: 2rem;
            font-weight: bold;
            text-align: center;
            margin-bottom: 1rem;
            color: #d4af37;
        }

        .plan-price {
            font-size: 3rem;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2rem;
            color: #ffd700;
        }

        .feature-list {
            list-style: none;
            margin-bottom: 2rem;
        }

        .feature-list li {
            padding: 0.5rem 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .feature-list li::before {
            content: "✓";
            color: #d4af37;
            font-weight: bold;
            font-size: 1.2rem;
        }

        /* Footer */
        .footer {
            background: #1a365d;
            color: white;
            text-align: center;
            padding: 2rem 0;
            border-top: 3px solid #d4af37;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .dashboard {
                grid-template-columns: 1fr;
            }
            
            .nav-links {
                display: none;
            }
            
            .hero h1 {
                font-size: 2.5rem;
            }
            
            .tracking-methods {
                grid-template-columns: 1fr;
            }
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
                <li><a href="#dashboard">Dashboard</a></li>
                <li><a href="#features">Funzionalità</a></li>
                <li><a href="#pricing">Prezzi</a></li>
                <li><a href="#contact">Contatti</a></li>
            </ul>
            <a href="#" class="cta-button">Prova Gratuita 14 Giorni</a>
        </nav>
    </header>

    <main class="main-content container">
        <section class="hero">
            <h1>GoldenTime Pro</h1>
            <p>Il sistema di rilevazione presenze che trasforma il tempo in valore per la tua azienda</p>
            <a href="#" class="cta-button" style="font-size: 1.2rem; padding: 1rem 2.5rem;">Inizia Ora</a>
        </section>

        <section id="dashboard" class="dashboard">
            <div class="sidebar">
                <h3 class="panel-title">
                    <i data-feather="users"></i>
                    Dipendenti Online
                </h3>
                <div class="employee-list">
                    <div class="employee-item">
                        <div>
                            <strong>Marco Rossi</strong><br>
                            <small>Sviluppatore</small>
                        </div>
                        <span class="status-badge status-online">Online</span>
                    </div>
                    <div class="employee-item">
                        <div>
                            <strong>Laura Bianchi</strong><br>
                            <small>Designer</small>
                        </div>
                        <span class="status-badge status-online">Online</span>
                    </div>
                    <div class="employee-item">
                        <div>
                            <strong>Giuseppe Verdi</strong><br>
                            <small>Manager</small>
                        </div>
                        <span class="status-badge status-offline">Offline</span>
                    </div>
                </div>
            </div>

            <div class="main-panel">
                <div class="time-clock">
                    <div class="current-time" id="currentTime">10:45:23</div>
                    <div class="current-date" id="currentDate">Venerdì, 1 Agosto 2025</div>
                    <button class="clock-in-btn" id="clockBtn" onclick="toggleClock()">
                        Timbratura Entrata
                    </button>
                </div>

                <h3 class="panel-title">
                    <i data-feather="smartphone"></i>
                    Metodi di Timbratura
                </h3>
                <div class="tracking-methods">
                    <div class="method-card" onclick="selectMethod('gps')">
                        <i data-feather="map-pin"></i>
                        <h4>GPS</h4>
                        <p>Localizzazione precisa</p>
                    </div>
                    <div class="method-card" onclick="selectMethod('nfc')">
                        <i data-feather="wifi"></i>
                        <h4>NFC Tag</h4>
                        <p>Tocca per timbrare</p>
                    </div>
                    <div class="method-card" onclick="selectMethod('qr')">
                        <i data-feather="maximize"></i>
                        <h4>QR Code</h4>
                        <p>Scansiona codice</p>
                    </div>
                    <div class="method-card" onclick="selectMethod('beacon')">
                        <i data-feather="radio"></i>
                        <h4>Beacon</h4>
                        <p>Rilevamento automatico</p>
                    </div>
                </div>

                <div class="recent-activity">
                    <h3 class="panel-title">
                        <i data-feather="activity"></i>
                        Attività Recenti
                    </h3>
                    <div class="activity-item">
                        <span>Timbratura entrata - Marco Rossi</span>
                        <span>09:00</span>
                    </div>
                    <div class="activity-item">
                        <span>Timbratura uscita - Laura Bianchi</span>
                        <span>18:30</span>
                    </div>
                    <div class="activity-item">
                        <span>Richiesta permesso - Giuseppe Verdi</span>
                        <span>15:45</span>
                    </div>
                </div>
            </div>

            <div class="right-panel">
                <h3 class="panel-title">
                    <i data-feather="bar-chart"></i>
                    Statistiche
                </h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">23</div>
                        <div>Dipendenti Attivi</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">184</div>
                        <div>Ore Questo Mese</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">98%</div>
                        <div>Puntualità</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">12</div>
                        <div>Progetti Attivi</div>
                    </div>
                </div>
            </div>
        </section>

        <section id="pricing" class="pricing-section">
            <h2 class="pricing-title">Piano Premium</h2>
            <div class="pricing-card">
                <div class="plan-name">PREMIUM</div>
                <div class="plan-price">da 7,00€<small>/mese</small></div>
                
                <ul class="feature-list">
                    <li>Utenti illimitati (amministratori, dipendenti, collaboratori)</li>
                    <li>Timbrature illimitate anche offline</li>
                    <li>GPS, Geofence, NFC, Beacons, QR code</li>
                    <li>Riconoscimento targhe</li>
                    <li>Richieste permessi, ferie, malattia</li>
                    <li>Gruppi e filiali</li>
                    <li>Creazione automatica fogli PDF</li>
                    <li>Allegati illimitati (foto e firme)</li>
                    <li>Clienti illimitati</li>
                    <li>Schedulazione lavori</li>
                    <li>Download illimitati app</li>
                    <li>Piattaforma web completa</li>
                    <li>Esportazione dati</li>
                </ul>
                
                <div style="text-align: center;">
                    <p style="margin-bottom: 1rem; opacity: 0.8;">
                        Sistema a ricarica - senza abbonamento annuale<br>
                        Ricariche da 25€ a 750€
                    </p>
                    <a href="#" class="cta-button" style="font-size: 1.1rem;">
                        Registrati Gratis - 14 Giorni
                    </a>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2025 GoldenTime Pro. Tutti i diritti riservati. | Prezzi IVA esclusa</p>
            <p>App gratuita disponibile su Apple Store e Google Play</p>
        </div>
    </footer>

    <script>
        // Initialize Feather icons
        feather.replace();

        // Update time
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

        // Clock in/out functionality
        let clockedIn = false;
        
        function toggleClock() {
            const btn = document.getElementById('clockBtn');
            clockedIn = !clockedIn;
            
            if (clockedIn) {
                btn.textContent = 'Timbratura Uscita';
                btn.classList.add('clocked-in');
                showNotification('Timbratura entrata registrata!', 'success');
            } else {
                btn.textContent = 'Timbratura Entrata';
                btn.classList.remove('clocked-in');
                showNotification('Timbratura uscita registrata!', 'success');
            }
        }

        // Method selection
        function selectMethod(method) {
            const methods = {
                'gps': 'GPS attivato - Posizione rilevata',
                'nfc': 'NFC pronto - Avvicina il dispositivo',
                'qr': 'Scanner QR attivato',
                'beacon': 'Ricerca beacon in corso...'
            };
            
            showNotification(methods[method], 'info');
        }

        // Notification system
        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${type === 'success' ? 'linear-gradient(45deg, #d4af37, #ffd700)' : 'linear-gradient(45deg, #1a365d, #2c5f41)'};
                color: ${type === 'success' ? '#1a365d' : 'white'};
                padding: 1rem 2rem;
                border-radius: 50px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                z-index: 10000;
                font-weight: bold;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // Initialize
        updateTime();
        setInterval(updateTime, 1000);

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add some interactive animations
        document.querySelectorAll('.method-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Simulate real-time updates
        setInterval(() => {
            const statsNumbers = document.querySelectorAll('.stat-number');
            statsNumbers.forEach(stat => {
                if (Math.random() > 0.7) {
                    const currentValue = parseInt(stat.textContent);
                    const change = Math.floor(Math.random() * 3) - 1;
                    if (currentValue + change > 0) {
                        stat.textContent = currentValue + change;
                        stat.style.color = '#ffd700';
                        setTimeout(() => {
                            stat.style.color = '#d4af37';
                        }, 500);
                    }
                }
            });
        }, 10000);
    </script>
</body>
</html>
