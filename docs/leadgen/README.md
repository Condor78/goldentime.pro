# Lead Gen — Aziende senza sito web (Vortex8)

Sistema n8n che, data **Regione + Ambito + Comune/Provincia + Categoria**, produce su Google Sheet le aziende locali che **non hanno un sito web** (lead per servizi web/grafica), con telefoni separati Cellulare/Fisso, indirizzo e stato su Google Maps.

## Come lanciare una ricerca
1. Apri il Form: **https://n8n.vortex8.it/form/09bfcad4-e7ec-473a-8b5c-dab406ca5ed6** (workflow `bG1wWiOGrNcBqhWS`).
2. Compila 4 campi:
   - **Regione** (tendina).
   - **Ambito**: `Comune` o `Provincia`.
   - **Comune / Città**: se Ambito=Comune → nome comune; se Ambito=Provincia → nome **provincia** (es. `Treviso`).
   - **Categoria** (testo, es. `elettricisti`, `idraulici`, `parrucchieri`). "Tutti"/vuoto sono bloccati.
3. Premi **Avvia ricerca**. L'elaborazione gira in background; i risultati compaiono sul Google Sheet dopo ~40 s (Comune) o ~2–3 min (Provincia).

Sheet risultati: `1TQmqMnYg5uyItxLDSFKUCKuseWBPTXxUINxkBFwURis`, tab gid `200566477`.

## I 4 stati (colonna "Stato Google Maps")
- **SENZA_SITO_CONFERMATO** — match certo con Google, nessun sito → **lead prioritario**.
- **NON_SU_MAPS** — l'azienda non è su Google Maps → lead prioritario, da confermare.
- **DA_VERIFICARE** — nessun match affidabile su Google → revisione manuale (link PG in Note).
- **SITO_PRESENTE** — ha il sito → **scartata (non scritta sul foglio)**.

Regola anti-errore: si scrive "senza sito" **solo** con match **certo** (telefono uguale, oppure via+CAP/comune, oppure via+nome) e assenza di `website` su Google. Verifica umana finale consigliata prima dell'outreach.

## P7 — Cellulare / Fisso
I telefoni PagineGialle vengono separati in due colonne. Regola (numerazione IT, dopo +39): parte nazionale che inizia con **3 → Cellulare**; con **0 → Fisso**; **800/803** e altri → **Fisso**. Più numeri nella stessa cella separati da ` / `.

## Crediti Serper per ricerca
1 chiamata Serper per azienda (dedup telefono prima di Serper). Stima: **ricerca Comune ≈ 30 crediti**, **ricerca Provincia ≈ 120–150 crediti** (6 comuni). Free tier ~2.500 una tantum.

## Limiti noti
- **AWS WAF su PagineGialle**: blocca richieste ravvicinate dallo stesso IP. Distanziare le ricerche; in modalità Provincia le pagine bloccate vengono saltate (non fanno fallire il run). Se tutte bloccate → errore chiaro, riprovare più tardi.
- **Paginazione parcheggiata**: si legge la 1ª pagina PG (~30 aziende/comune). Estendere la paginazione aumenterebbe i blocchi WAF.
- **Provincia**: coperti i ~6 comuni principali per provincia mappata (non tutti i comuni).

## Come aggiungere una categoria
La categoria è testo libero: basta scriverla nel Form con lo slug PagineGialle (minuscolo). Verifica che esista come pagina PG (`/{regione}/{comune}/{categoria}.html`).

## Come aggiungere una provincia
Nel nodo **"Valida e costruisci URL"** (workflow `bG1wWiOGrNcBqhWS`), aggiungi una voce alla mappa `PROV` con chiave = nome provincia minuscolo e valore = array dei comuni principali. Province già mappate: **Treviso, Venezia, Pordenone**. Per province in Friuli usa Regione = "Friuli-Venezia Giulia".

## Credenziali
Nessuna chiave in chiaro: si usano solo gli ID credenziale n8n — Serper `2DYoDPLOH0WgJ4Z7` (httpHeaderAuth), Google `DjYVjx24xdK6EtSK` (service account).

## Struttura workflow (7 nodi)
`Form → Valida e costruisci URL → HTTP - PagineGialle → Estrai aziende → Serper - Verifica Maps → Match e Classifica → Scrivi su Google Sheet`.
