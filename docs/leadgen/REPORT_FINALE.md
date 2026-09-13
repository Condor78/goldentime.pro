# Report finale — Lead Gen v2 (P1–P5, P7)

**Data:** 2026-09-13 · Workflow di produzione: `bG1wWiOGrNcBqhWS` (aggiornato in un solo deploy, attivo).

## Cosa è stato cambiato
- **P1+P2 (match affidabile):** presenza sito determinata da Google (Serper) **solo dopo** `match_confidence` v2 (telefono uguale su qualunque numero, oppure via+CAP/comune, oppure via+nome). Query Serper = `nome + via + comune`.
- **P3 (4 stati):** SENZA_SITO_CONFERMATO / SITO_PRESENTE / DA_VERIFICARE / NON_SU_MAPS. SITO_PRESENTE scartato.
- **P4 (categoria):** "Tutti"/vuoto bloccati nel nodo Valida.
- **P5 (copertura):** modalità **Provincia** (ciclo sui comuni principali) come alternativa alla paginazione, che resta parcheggiata per il WAF.
- **P7 (Cellulare/Fisso):** telefoni multipli estratti da tutti i `contactPoint`, separati per tipo (3→Cellulare, 0/800→Fisso), uniti da ` / `.
- **Estrazione** JSON-LD resiliente al challenge WAF (salta pagine bloccate), **dedup su telefono** prima di Serper (≤1 credito/azienda).
- **Nodo Filtro rimosso** (ridondante: SITO_PRESENTE già escluso a monte). Nessun nodo orfano.

## Precisione misurata (prototipo offline, campione 50 aziende reali)
Metodo §8: dati reali → prototipo offline (`prototipo_match_v3.py`) → misura.
| Stato | n | % |
|---|---|---|
| SENZA_SITO_CONFERMATO | 10 | 20% |
| SITO_PRESENTE | 23 | 46% |
| DA_VERIFICARE | 6 | 12% |
| NON_SU_MAPS | 11 | 22% |

Criteri §9: **0 falsi SENZA_SITO_CONFERMATO** (10/10 match coerenti, nessun sito su Google) · DA_VERIFICARE **12%** (≤25%) · telefono+indirizzo **100%** (≥95%) · **1 credito/azienda** · P7 split corretto.

Test end-to-end sul workflow di produzione (Conegliano/elettricisti, nodo Sheet a parte): 30 aziende → 19 righe (9 SENZA_SITO_CONFERMATO, 5 NON_SU_MAPS, 5 DA_VERIFICARE), Cellulare/Fisso popolati correttamente.

## Crediti Serper
- Stima a regime: **Comune ≈ 30 crediti/ricerca**, **Provincia ≈ 120–150** (6 comuni).
- Consumo di questa fase di analisi/validazione: ~80 crediti (50 misura + ~30 test). Il saldo esatto va letto sul cruscotto serper.dev.

## Stato §11 (Definition of Done)
| Artefatto | Stato |
|---|---|
| Workflow `bG1wWiOGrNcBqhWS` | ✅ logica nuova P1–P5,P7 deployata in un update; nodi con nomi chiari; nessun orfano; e2e verificato (pre-Sheet) |
| Workflow `7E9Ju3nnGEyOjzZO` | ✅ già eliminato (confermato dall'owner) |
| Google Sheet | ⏳ **in attesa**: intestazione Cellulare/Fisso + pulizia righe vecchie richiede lo svuotamento del foglio, bloccato dalla modalità automatica ("mass delete") → serve consenso o pulizia manuale |
| csv `lead_recuperati_conegliano.csv` | ✅ coperto: non nel progetto; i dati vengono riscritti sul Sheet con la logica nuova |
| Form Trigger | ✅ 4 campi (Regione, Ambito, Comune/Provincia, Categoria), usabile da telefono; "Tutti"/vuoto bloccati |
| Credenziali | ✅ solo ID, nessuna chiave in chiaro |
| Documentazione | ✅ `docs/leadgen/README.md` |
| Report finale | ✅ questo file |

## Cose aperte
1. **Svuotamento/riscrittura del Google Sheet** con intestazione Cellulare/Fisso: bloccato dalla policy anti-cancellazione. Opzioni: (a) l'owner autorizza lo svuotamento, poi una ricerca ripopola pulito; (b) l'owner svuota a mano le righe (tenendo/rinominando l'intestazione). Finché non fatto, questa riga §11 resta gialla.
2. Paginazione PG oltre la 1ª pagina (vincolata dal WAF).
3. Outreach WhatsApp/SMS: fuori scope (P7 nota: consenso/opt-in, art. 130 Codice Privacy).
