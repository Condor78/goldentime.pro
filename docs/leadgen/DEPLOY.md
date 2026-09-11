# Deploy — Lead Gen Aziende senza sito (v2)

## Stato

- **Workflow di produzione v2 creato e TESTATO end-to-end:** `Lead Gen - Aziende senza sito web (v2)` — ID `9hfN90QMP7LTF88Q` — **INATTIVO** (da attivare a mano).
  - Credenziali agganciate: Serper `2DYoDPLOH0WgJ4Z7`, Google `Google Service Account account 2` `DjYVjx24xdK6EtSK`.
  - Form path: `/form/lead-senza-sito` (URL nuovo, diverso dal workflow originale).
  - Robustezza: nodi Serper e Sheets con **retry** (3 tentativi); Serper con `onError=continueRegularOutput` (un singolo errore su un'azienda non blocca l'intero run).
  - **Verifica reale (11/09/2026):** run e2e Veneto/Conegliano/Elettricisti → 30 aziende → **22 righe scritte** sul foglio (SENZA_SITO_CONFERMATO 12, NON_SU_MAPS 7, DA_VERIFICARE 3). Le 8 SITO_PRESENTE sono state scartate. ⚠️ Il foglio quindi NON è più solo-intestazione: contiene già queste 22 righe di test (reali, valide) più i dati del vecchio workflow.
  - Intestazione reale del foglio: l'ultima colonna è **`Note`** (non "Note (URL PagineGialle)"): il mapping è allineato.
- **Workflow originale** `bG1wWiOGrNcBqhWS`: **non modificabile via MCP** (ha "MCP access" OFF). Non è stato toccato.

## Perché un workflow nuovo invece di aggiornare l'originale

Aggiornare l'originale via strumenti automatici richiede che sia attivo il flag **"MCP access"** su quel workflow (interruttore nella UI n8n, sulla card del workflow → Settings). Finché è OFF, l'originale è in sola lettura per l'automazione. Per non restare bloccati, la logica v2 completa è stata messa in un workflow nuovo, pronto all'uso.

## Come mettere in produzione (scegli A o B)

**A. Usa il nuovo workflow (più veloce)**
1. Apri `9hfN90QMP7LTF88Q`, esegui una prova manuale (pulsante Test) con Regione/Comune/Categoria.
2. Verifica le righe scritte sul Google Sheet.
3. Attiva il workflow (toggle Active). Il nuovo URL del Form sostituisce il vecchio.
4. Disattiva il vecchio `bG1wWiOGrNcBqhWS` per evitare doppioni.

**B. Mantieni l'URL del Form vecchio**
1. Sul workflow `bG1wWiOGrNcBqhWS` attiva "MCP access" (UI).
2. Da lì si può portare la logica v2 dentro l'originale mantenendo il `webhookId` del Form esistente.

## Verifica prima del primo run pulito (P6)

- Intestazione reale del foglio (allineata nel mapping):
  `Data ricerca | Regione | Comune | Categoria | Ragione sociale | Indirizzo | Telefono | Sito web | Stato Google Maps | Note`
- Per un primo run pulito, svuota le righe sotto l'intestazione (il foglio contiene già dati del vecchio workflow + 22 righe del test e2e).
- Se i nomi delle colonne nel foglio differiscono da questi, allinea l'intestazione **oppure** il mapping del nodo "Scrivi su Google Sheet".
- Dedup: il nodo usa `appendOrUpdate` con colonna chiave **Telefono** (più robusta di "Note").

## Attenzione operativa (AWS WAF)

PagineGialle blocca richieste ravvicinate dallo stesso IP (vedi `ANALISI_FASE2-3.md` §8). In pratica:
- Fai ricerche **distanziate** (non a raffica).
- Se compare l'errore "challenge anti-bot", attendi qualche minuto e riprova.
- La paginazione (oltre le ~30 aziende/pagina) è **parcheggiata**: va affrontata solo con una mitigazione del WAF.

## Pulizia workflow temporanei

Archiviati a fine Fase 1: `lEj5oBmCtyiRIdTY` (collector), `fLElkxrRMYfbO0Mx` (test Serper+match).
Da eliminare a mano se ancora presente: `7E9Ju3nnGEyOjzZO` (TEMP - Pulizia duplicati, non accessibile via MCP).
