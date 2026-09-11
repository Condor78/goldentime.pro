# BRIEF TECNICO — Lead Gen "Aziende senza sito web" (Vortex8)

**Data:** 11/09/2026
**Owner:** Giovanni Condorelli (Vortex8)
**Destinatario:** Claude Code
**Regola di lavoro:** NIENTE tentativi. Prima analisi su dati reali, poi progettazione, poi test offline, poi UN solo deploy su n8n. Ogni decisione tecnica va motivata con un dato verificato, non con un'ipotesi.

---

## 1. Obiettivo

Sistema che, scelta una **Regione + Comune + Categoria merceologica**, produce su Google Sheet l'elenco delle aziende locali che **NON hanno un sito web** (target commerciale per servizi di sito web/grafica), con telefono, indirizzo e stato presenza su Google Maps.

Output finale per riga: `Data ricerca | Regione | Comune | Categoria | Ragione sociale | Indirizzo | Telefono | Sito web | Stato Google Maps | Note (URL PagineGialle)`

## 2. Vincoli non negoziabili

- **Costo: 0 €.** Nessuna carta di credito su nessun servizio. Serper.dev free tier (2.500 crediti una tantum, oggi ne restano ~2.300). Per il lungo periodo: SerpApi free (250/mese, no carta) come fallback.
- **Precisione prima della velocità.** Un falso "senza sito" (contattare un'azienda dicendole che non ha un sito quando ce l'ha) è il peggior errore possibile per l'immagine commerciale.
- **Una soluzione alla volta.** Non aprire strade parallele.
- **Dati solo pubblici.** Nessun dato personale oltre a ragione sociale, indirizzo, telefono aziendale pubblicato.

## 3. Infrastruttura esistente (NON ricreare, riusare)

| Componente | Valore |
|---|---|
| n8n self-hosted | Accesso via MCP `n8n-vortex8` già configurato in Claude Desktop |
| Workflow principale | `Lead Gen - Aziende senza sito web` — ID `bG1wWiOGrNcBqhWS` (attivo) |
| Form Trigger webhookId | `09bfcad4-e7ec-473a-8b5c-dab406ca5ed6` |
| Credenziale Serper.dev (n8n) | `Serper.dev API` — ID `2DYoDPLOH0WgJ4Z7` (tipo httpHeaderAuth, header `X-API-KEY`, dominio `google.serper.dev`) |
| Credenziale Google (n8n) | `Google Service Account account 2` — ID `DjYVjx24xdK6EtSK` (tipo googleApi, auth `serviceAccount`) |
| Google Sheet destinazione | ID `1TQmqMnYg5uyItxLDSFKUCKuseWBPTXxUINxkBFwURis`, tab "Untitled" gid `200566477`, cartella Drive `VORTEX8` |
| Workflow temporaneo | `TEMP - Pulizia duplicati Lead Gen` — ID `7E9Ju3nnGEyOjzZO` — **da eliminare** |

Stato attuale del workflow principale (8 nodi): `Form → Blocca categoria Tutti → HTTP PagineGialle → Estrai aziende (Code) → Serper /places → Classifica sito e maps (Code) → Filtra solo senza sito reale → Scrivi su Google Sheet (appendOrUpdate, match su "Note", cellFormat RAW)`.

## 4. Fatti VERIFICATI sulla fonte dati (PagineGialle)

Questi sono dati osservati su HTML reale, non ipotesi. Ripartire da qui.

1. **URL pattern:** `https://www.paginegialle.it/{regione}/{comune}/{categoria}.html` (slug minuscolo, spazi → `_`). Es. `/veneto/conegliano/elettricisti.html`.
2. **Richiede header `User-Agent` da browser**, altrimenti risponde 403 Forbidden.
3. **La pagina NON è renderizzata in JS** — una GET semplice restituisce HTML completo.
4. **Dati strutturati puliti disponibili in JSON-LD:** un `<script type="application/ld+json">` con `@type: "ItemList"`. Ogni `itemListElement[i].item` contiene: `name`, `url` (scheda PG, univoco), `address.{streetAddress, postalCode, addressLocality, addressRegion}`, `contactPoint[].telephone`. **Questa è la fonte per nome/indirizzo/telefono — non fare parsing dei tag HTML.**
5. **Il JSON-LD NON contiene il sito web dell'azienda** (nessun campo `sameAs`/`url` esterno).
6. **Il pulsante "Sito web" nell'HTML compare quasi solo per i clienti paganti** (marker `data-pag="sito_ig"` per schede sponsorizzate, `title="sito web - {Nome}"` per rare schede gratuite). Le aziende con scheda gratuita possono avere un sito reale che PagineGialle **non mostra**. → **PagineGialle NON è una fonte affidabile per "ha/non ha un sito".**
7. Una pagina restituisce ~30 aziende (prima pagina). Paginazione non ancora gestita.
8. Categorie generiche ("Tutti", "Graphic designer") restituiscono risultati fuori tema (catene nazionali, aziende di altre province). Servono categorie merceologiche specifiche.

## 5. Fatti VERIFICATI su Serper.dev

- Endpoint `POST https://google.serper.dev/places`, body `{"q": "..."}`, header `X-API-KEY`. 1 credito per chiamata.
- Risposta: `{ "places": [ { "title", "address", "website"?, "phoneNumber"?, "rating", "cid", ... } ] }`. Il campo `website` è presente solo se Google lo conosce.
- **Rate limit:** chiamate parallele → errore "too many requests". Serve batch 1 richiesta/secondo.
- **Problema critico osservato:** cercando per solo `nome + comune`, `places[0]` è spesso un'**omonima diversa** (altra città, altro settore). Esempi reali: "Dall'Antonia Alessandro" (elettricista) → chirurgo plastico; "Elettroservice" → negozio di stufe; "Rizzo Giorgio Srl" → negozio di arredamento. **Non si può usare `places[0].website` senza verificare che sia davvero la stessa azienda.**

## 6. Problemi noti da risolvere (in ordine di priorità)

### P1 — Rilevamento sito web inaffidabile (BLOCCANTE)
Oggi il sistema classifica "senza sito" aziende che un sito ce l'hanno (es. Amplifon, Centro Abbronzatura Infinity). Causa: vedi §4.6. Soluzione richiesta: determinare la presenza del sito da **Google** (Serper), ma solo dopo aver **verificato il match** (P2).

### P2 — Matching per omonimi (BLOCCANTE)
Serve una funzione `match_confidence(azienda_PG, place_Serper)` che confronti almeno due tra: telefono normalizzato, CAP, via, comune. Regola proposta da validare:
- **Match certo:** telefono uguale OPPURE (stessa via + stesso CAP)
- **Match probabile:** stesso CAP + nome molto simile (similarità stringa > soglia)
- **Nessun match:** tutto il resto → l'azienda va segnata `da verificare`, NON "senza sito"

Solo con match certo/probabile si legge `website`. Query Serper da testare: `nome + via + comune` (oggi è `nome + via`).

### P3 — Classificazione finale a 4 stati (non binaria)
Sostituire "ASSENTE/presente" con:
- `SENZA_SITO_CONFERMATO` — match certo, nessun `website` → lead prioritario
- `SITO_PRESENTE` — match certo, `website` presente → scartare
- `DA_VERIFICARE` — nessun match affidabile → revisione manuale (link PG in Note)
- `NON_SU_MAPS` — Serper non restituisce nulla → lead prioritario, ma da confermare

### P4 — Validazione categoria
Bloccare "Tutti" e vuoto (già fatto). Valutare se verificare che la pagina PG restituita corrisponda davvero alla categoria richiesta (es. leggendo `<title>`/`<h1>`), per intercettare categorie inesistenti che PG "allarga" a risultati fuori tema.

### P5 — Paginazione
Gestire pagine successive (`?p=2` o pattern da verificare) per superare le ~30 aziende per ricerca.

### P6 — Pulizia
Eliminare workflow `7E9Ju3nnGEyOjzZO`. Verificare che il foglio abbia solo l'intestazione prima del primo run pulito.

## 7. Bug già risolti (non reintrodurre)

- Google Sheets interpreta `+39 ...` come formula → `#ERROR!`. Fix: opzione `cellFormat: RAW` sul nodo Sheets. **Mantenere.**
- Nodo Sheets con `mappingMode: defineBelow` richiede `columns.schema` esplicito. **Mantenere.**
- Riferimento al tab per nome ("Foglio1") fallisce: usare `mode: list` con gid `200566477`.
- Anti-duplicati custom (read+code) moltiplicava le righe. Fix: `operation: appendOrUpdate` con `matchingColumns: ["Note"]`. **Mantenere.**
- Serper in parallelo → rate limit. Fix: batching `batchSize: 1, batchInterval: 1000`. **Mantenere.**

## 8. Metodo di lavoro richiesto

1. **Analisi (prima di scrivere codice di produzione):** scaricare e salvare in locale almeno 6 pagine PG reali (3 categorie × 2 comuni, incluso un comune non veneto). Salvare anche 30 risposte Serper reali per le stesse aziende.
2. **Prototipo offline:** script Python/Node che estrae dal JSON-LD, chiama Serper, applica `match_confidence`, produce i 4 stati. Nessun n8n in questa fase.
3. **Misura:** su un campione di **50 aziende verificate a mano** (aprire il sito/Google), calcolare precisione per ciascuno dei 4 stati. Riportare i numeri.
4. **Deploy:** solo quando P1+P2+P3 superano i criteri di §9, portare la logica nel Code node di n8n con UN aggiornamento del workflow. Test finale end-to-end dal Form.
5. **Report:** cosa è stato cambiato, numeri di precisione, crediti Serper consumati, cosa resta aperto.

## 9. Criteri di accettazione

- Nessun falso `SENZA_SITO_CONFERMATO` su un campione di 50 aziende verificate a mano (0 tolleranza: è l'errore che danneggia l'immagine commerciale).
- `DA_VERIFICARE` ≤ 25% delle aziende (altrimenti il sistema scarica troppo lavoro manuale).
- Zero righe duplicate dopo 2 run identici consecutivi.
- Telefono e indirizzo popolati su ≥ 95% delle righe.
- ≤ 1 credito Serper per azienda.
- Il Form deve restare usabile da telefono in 3 campi (Regione tendina, Comune testo, Categoria testo o tendina fissa di categorie validate).

## 10. Fuori scope (per ora)

- Tendina categorie dinamica per città (n8n Form non lo supporta nativamente; richiederebbe form HTML custom). Parcheggiato.
- Registro Imprese / Telemaco (a pagamento).
- Google Places API ufficiale (richiede carta).
- Outreach automatico: prima si valida la qualità della lista.
