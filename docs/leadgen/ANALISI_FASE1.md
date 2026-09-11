# FASE 1 — Analisi su dati reali (PagineGialle)

**Data:** 2026-09-11 · **Owner:** Giovanni Condorelli (Vortex8) · **Stato:** parte PagineGialle completata. Parte Serper = PASSO 2.

## 0. Metodo (adattato al vincolo di rete)

L'ambiente Claude Code **non raggiunge** `paginegialle.it` né `google.serper.dev` (bloccati dalla policy di rete del sandbox, verificato: 403 in uscita). Il tuo **n8n self-hosted li raggiunge** e ha già la chiave Serper.
→ La raccolta dati passa da un workflow n8n temporaneo **"collector"** (`lEj5oBmCtyiRIdTY`), i dati grezzi vengono salvati come fixtures nel repo, l'analisi/prototipo gira su quei fixtures. Vincolo 0 € rispettato (0 crediti Serper in questa fase).

- Sorgente riproducibile: `docs/leadgen/collector.ts` (codice SDK del workflow).
- Dati: `docs/leadgen/fixtures/pg_pages.json` (150 aziende reali).
- Esecuzioni n8n: `222841`, `222860` (identiche → risultato stabile).

## 1. Cosa è stato raccolto

6 combinazioni richieste (3 categorie × 2 comuni, 1 non-veneto): **Conegliano** (Veneto) e **Catania** (Sicilia) × `elettricisti`, `idraulici`, `parrucchieri`.

**5 pagine su 6 estratte** (150 aziende). La 6ª (Catania/parrucchieri) è bloccata → vedi §3.1.

## 2. Verifica dei fatti del brief (§4) — su HTML reale

| # | Fatto brief | Esito | Nota |
|---|---|---|---|
| 4.1 | URL `/{regione}/{comune}/{categoria}.html` | ✅ CONFERMATO | Funziona per Veneto e Sicilia. |
| 4.2 | Serve `User-Agent` browser | ⚠️ NECESSARIO MA NON SUFFICIENTE | Con UA browser passano 5/6. La 6ª prende un **challenge AWS WAF** (vedi §3.1). Fatto NUOVO, non nel brief. |
| 4.3 | Pagina NON renderizzata in JS | ✅ CONFERMATO (se superi il WAF) | GET restituisce HTML completo con JSON-LD (~450–560 KB). Quando scatta il WAF torna solo uno stub JS (2,4 KB). |
| 4.4 | Dati puliti in JSON-LD `ItemList` | ✅ CONFERMATO | 4 blocchi ld+json/pagina, 1 è l'ItemList. `name`, `address.*`, `contactPoint[].telephone` estratti correttamente. **Niente parsing HTML necessario.** |
| 4.5 | JSON-LD non contiene il sito | ✅ COERENTE | Nessun sito esterno nel JSON-LD. (Confermato: il sito va preso da Serper.) |
| 4.6 | PG mostra il sito solo per paganti → inaffidabile | ✅ CONFERMATO | Marker "sito web" per pagina: 0–4 su 30 aziende. Troppo pochi → PG **non** è fonte per "ha/non ha sito". |
| 4.7 | ~30 aziende/pagina | ✅ CONFERMATO | 30/30/30 su tutte. Ma H1 dichiara "più di 200 risultati" (Conegliano) / "74" / "56" (Catania) → **serve paginazione (P5)**. |
| 4.8 | Categorie generiche = fuori tema | ✅ CONFERMATO + AGGRAVANTE | Anche con categorie **specifiche** entrano fuori-tema (vedi §3.2). |

## 3. Problemi NUOVI trovati (non nel brief)

### 3.1 — AWS WAF challenge rate-based (impatta P5/scaling) 🔴
La 6ª richiesta della sequenza riceve **sempre** (2 run su 2) HTTP `202` con header `x-amzn-waf-action: challenge` e una pagina JS-only ("JavaScript is disabled"). Non è un 403 e non è casuale: è l'**ultima** richiesta della raffica → protezione **a soglia di frequenza** sull'IP di n8n.
- Impatto: con la paginazione (P5) e ricerche multiple si superano facilmente le richieste "gratis" prima del challenge.
- Il challenge NON è risolvibile da una GET server-side (richiede JS in un browser headless).
- **Mitigazioni possibili (da decidere in fase di deploy):** rallentare (batchInterval ≥ 2–3 s + jitter), retry con backoff sulle risposte `202`/header WAF, limitare il numero di pagine per run. Da NON risolvere adesso: è un tema di scaling, non di precisione.

### 3.2 — Rumore di categoria (impatta P4) 🟠
Con categoria specifica, alcune schede sono comunque fuori tema. Esempi reali dai dati:
- Elettricisti Conegliano → **"Intesa Sanpaolo"** (banca, pg_url `/banche/`), **"G.E.M."** (`/imprese-edili/`).
- Elettricisti Catania → **"Bennati Studio Legale"** (pg_url mostra `elettrohertz`, incoerente), **"Catania Multiservizi S.p.a."**.
- Parrucchieri Conegliano → **"Hair Modeling…"** con pg_url `/farmacie/farmacia-ag-farma`.
→ La `pg_url` contiene spesso il **vero** segmento-categoria: utile come segnale per validare/filtrare (P4).

### 3.3 — Dispersione provinciale: 26% fuori dal comune cercato (impatta P2) 🟠
Su 150 aziende, **39 (26%)** NON sono nel comune cercato ma nella provincia (es. cercando "Conegliano" escono San Vendemiano, Susegana, Vittorio Veneto…; un caso perfino a Pordenone/Bologna).
→ **Conseguenza per il matching (P2):** il "comune cercato" NON è un discriminante affidabile. Nella query Serper va usato il **comune reale dell'azienda** (`addressLocality` del JSON-LD), non quello del form.

### 3.4 — Duplicati oltre il pg_url (impatta P6/anti-duplicati) 🟠
Molte aziende compaiono 2 volte nella stessa pagina con **pg_url diverso ma stesso telefono** (es. `+39 0438 418001`, `+39 336 501412`, `+39 340 9718778`, `+39 095 317956`…).
→ L'anti-duplicati attuale su colonna "Note" (= pg_url) **non** li intercetta. La chiave di dedup robusta è il **telefono normalizzato (E.164)**.

## 4. Qualità dati (verso i criteri §9)

| Metrica | Risultato | Criterio §9 |
|---|---|---|
| Telefono popolato | **150/150 (100%)** | ≥ 95% ✅ |
| Indirizzo (via) popolato | **150/150 (100%)** | ✅ |
| CAP popolato | **150/150 (100%)** | (usato nel matching) |
| Formato telefono | uniforme `+39 <prefisso> <numero>` | ottimo per normalizzazione |

**Il telefono è il segnale più forte** per il matching (100% presente, formato regolare): sarà la chiave primaria di `match_confidence` e di dedup.

## 5. Conseguenze operative per le fasi successive

- **P2 (matching omonimi):** query Serper = `nome + via + comune_reale_azienda`. Chiave di match = telefono normalizzato; fallback CAP+via. Comune del form = NON usare come filtro.
- **P3 (4 stati):** dipende da Serper → PASSO 2.
- **P4 (validazione categoria):** usare `pg_url` (segmento categoria) + eventuale confronto con `<h1>` per scartare fuori-tema.
- **P5 (paginazione):** necessaria (30 su 200+), ma vincolata dal WAF (§3.1) → gestire con rate limit/backoff.
- **P6 (dedup):** su **telefono E.164**, non su pg_url.

## 6. Cosa manca in Fase 1

- **PASSO 2:** 30 risposte Serper reali sulle stesse aziende (≈30 crediti su ~2.300), per progettare e misurare `match_confidence` e i 4 stati.
- **PASSO 3:** prototipo + misura precisione su 50 aziende verificate a mano (criteri §9).

## 7. Pulizia (P6)

Da eliminare a fine Fase 1: collector temporaneo `lEj5oBmCtyiRIdTY` e `TEMP - Pulizia duplicati` `7E9Ju3nnGEyOjzZO`. (Tenuto il collector fino a fine PASSO 2, poi rimosso.)
