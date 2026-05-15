# GoldenTime Linen

Gestione consumi biancheria (lenzuola, federe, asciugamani, scendi-doccia) per la
locazione turistica **Wanderlust** (appartamenti W1, W2 e annuncio combinato W12).

Importa le prenotazioni da **KrossBooking** leggendo direttamente le email
dell'account `prenotazioni40@gmail.com` (OAuth Gmail read-only).

## Regole di calcolo dotazione

| Voce | Regola |
|---|---|
| Letti | Tutti matrimoniali. `n_letti = ceil(pax / 2)`, mai oltre i letti dell'appartamento. |
| Lenzuola | 2 per letto |
| Federe | 2 per letto |
| Telo grande (doccia) | 1 per persona |
| Telo medio (viso) | 1 per persona |
| Scendi-doccia | 1 per prenotazione |
| Culla | Gestione interna, **NON contata** |
| Lettino W2 (7° pax) | Gestione interna, **NON contata** |
| W12 (combo) | Somma W1 + W2; pax distribuiti su entrambi (default equo, ridistribuibile in UI) |

## Appartamenti precaricati

- **W1** Wanderlust 1 - max 6 pax, 3 letti matrimoniali (2 + 1 divano letto)
- **W2** Wanderlust 2 - max 6 pax, 3 letti matrimoniali (2 + 1 divano letto). 7° pax = lettino interno
- **W12** Annuncio combinato W1 + W2

## Setup

Richiede **Node 20+**.

```bash
npm install
cp .env.example .env
# compila GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET in .env
npm start
```

Apri `http://localhost:3000`.

### Configurare Gmail OAuth

1. Vai su [Google Cloud Console](https://console.cloud.google.com/), crea un progetto.
2. **APIs & Services > Library** → abilita **Gmail API**.
3. **OAuth consent screen** → tipo "External", scope `gmail.readonly`. Aggiungi
   `prenotazioni40@gmail.com` come test user.
4. **Credentials > Create credentials > OAuth client ID**, tipo **Web application**.
5. Authorized redirect URIs: `http://localhost:3000/api/gmail/callback`.
6. Copia Client ID e Client Secret in `.env`.
7. Avvia il server, vai su **Gmail** nell'app, premi **Connetti Gmail**, autorizza
   con `prenotazioni40@gmail.com`.
8. Premi **Sincronizza ora** per importare le prenotazioni KrossBooking.

Il filtro mail si configura via `GMAIL_SEARCH_QUERY` in `.env`
(default: `from:(krossbooking) newer_than:90d`).

## Struttura

```
src/
  server.js     # Express API
  db.js         # SQLite (better-sqlite3), schema + seed
  supplies.js   # Regole calcolo dotazione
  parser.js     # Parser email KrossBooking (italiano/inglese)
  gmail.js     # OAuth Gmail + sync
public/
  index.html app.js style.css   # UI single-page
data/
  goldentime.db  # SQLite (generato all'avvio, in .gitignore)
legacy/
  clock-in-prototype.html  # vecchio prototipo timbrature
```

## Funzionalità UI

- **Dashboard** - check-in nei prossimi 7 giorni, stato Gmail, sync rapido
- **Prenotazioni** - lista, dettaglio, nuova manuale, import email da testo,
  calcolo/anteprima dotazione, registrazione consegnato vs previsto
- **Non conformi** - registro separato con motivo (macchia, strappo, mancante,
  usura, bruciatura, altro), q.tà, articolo, appartamento, prenotazione collegata
- **Report** - consumo previsto/consegnato e totali non conformi per periodo
- **Appartamenti** - configurazione (sola lettura nell'UI, modificabile via DB)
- **Gmail** - stato connessione, sync manuale, istruzioni setup

## Note sul parser KrossBooking

Il parser è euristico (regex su soggetto + corpo). Riconosce campi tipici come
`Check-in`, `Arrivo`, `Ospiti`, `Adulti`, `Bambini`, `Culla`, e i codici
appartamento `Wanderlust 1 / 2 / 12` (e varianti `W1 W2 W12`).

Se una mail non viene riconosciuta, la trovi nei "Skipped" del risultato di sync:
puoi importarla manualmente con **Incolla email** dalla scheda Prenotazioni.

Per le combo (W12) la distribuzione pax tra W1 e W2 è modificabile dal dettaglio
prenotazione prima del calcolo dotazione.

## Limiti noti / TODO

- Nessuna autenticazione utente (single-user su localhost / LAN).
- Foto allegate ai non conformi non gestite (opzione esclusa in fase di setup).
- Cambi biancheria intermedi non gestiti automaticamente (solo set di check-in).
- Costi unitari su articoli previsti nel modello DB ma non ancora editabili da UI.
