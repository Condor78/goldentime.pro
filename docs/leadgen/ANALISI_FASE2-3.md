# FASE 1 — PASSO 2/3: Serper, matching e classificazione (misura di precisione)

**Data:** 2026-09-11 · **Owner:** Giovanni Condorelli (Vortex8)

## 1. Cosa è stato fatto

1. **PASSO 2 — Serper reale.** Su un campione di **50 aziende** (10 per pagina × 5 pagine di Fase 1) è stata interrogata `POST google.serper.dev/places` con query `nome + via + comune_reale`, 1 richiesta/1,1 s. Costo: ~50 crediti (di ~2.300).
2. **PASSO 3 — prototipo offline.** La logica `match_confidence` + 4 stati è stata sviluppata e misurata **offline in Python** (`prototipo_match.py`) sulle risposte Serper reali salvate (`fixtures/serper_sample.json`), senza consumare altri crediti. Questo isola l'algoritmo dalla rete (spirito del brief §8.2).

## 2. `match_confidence` (v2) — come decide

Confronto azienda PagineGialle ↔ ogni `place` restituito da Serper. Livelli:

- **CERTO** se: telefono normalizzato uguale **OPPURE** (via [num+nome] + CAP/comune) **OPPURE** (via [num+nome] + nome simile).
- **PROBABILE** se: nome simile + CAP/comune (ma via non confermata).
- **NESSUNO**: tutto il resto.

Normalizzazioni: telefono → sole cifre, rimozione prefisso `39` (così `+39 0438 23188` = `0438 23188`); confronto via/nome/CAP a token (no accenti/punteggiatura).

**Regola di sicurezza (anti-errore commerciale):** solo un match **CERTO** può produrre `SENZA_SITO_CONFERMATO`. Un match solo PROBABILE finisce in `DA_VERIFICARE`, mai in "senza sito".

## 3. I 4 stati

| Stato | Condizione | Uso |
|---|---|---|
| `SENZA_SITO_CONFERMATO` | match CERTO + nessun `website` su Google | **lead prioritario** |
| `SITO_PRESENTE` | match CERTO + `website` presente | scartato (non scritto sul foglio) |
| `DA_VERIFICARE` | Serper ha risposto ma nessun match affidabile | revisione manuale (link PG in Note) |
| `NON_SU_MAPS` | Serper non restituisce nulla | lead prioritario, da confermare |

## 4. Risultati misurati (campione 50)

| Stato | v1 (base) | **v2 (adottata)** |
|---|---|---|
| SENZA_SITO_CONFERMATO | 9 (18%) | **10 (20%)** |
| SITO_PRESENTE | 23 (46%) | **25 (50%)** |
| DA_VERIFICARE | 11 (22%) | **8 (16%)** |
| NON_SU_MAPS | 7 (14%) | **7 (14%)** |

La v2 (match su CAP + via+nome) recupera match reali che la v1 scartava perché Serper a volte omette il comune nell'indirizzo o usa la frazione (es. Ceschin, Idrosistemi, Star Tec).

## 5. Verifica criteri di accettazione (§9)

| Criterio §9 | Esito |
|---|---|
| **0 falsi `SENZA_SITO_CONFERMATO`** su campione verificato | ✅ **10/10 corretti** (telefono/indirizzo/nome coerenti col profilo Google, e nessun sito su Google). 0 falsi positivi. |
| `DA_VERIFICARE` ≤ 25% | ✅ **16%** |
| Telefono e indirizzo ≥ 95% | ✅ **100%** (Fase 1) |
| ≤ 1 credito Serper / azienda | ✅ **1 chiamata/azienda** |
| Zero duplicati dopo 2 run | ✅ per costruzione: dedup `appendOrUpdate` su **Telefono** normalizzato |

**Nota onesta sulla verifica.** "Nessun sito" è verificato come **assenza del campo `website` in Google** (definizione operativa del brief §P3) + match azienda corretto. Il rischio residuo — azienda con un sito che Google non conosce — resta, ed è il motivo per cui il controllo umano finale prima dell'outreach va sempre fatto sui `SENZA_SITO_CONFERMATO`. La logica è volutamente conservativa: preferisce mandare in `DA_VERIFICARE` piuttosto che rischiare un falso "senza sito".

## 6. I 10 lead "SENZA_SITO_CONFERMATO" del campione (tutti verificati)

Tutti con match confermato e nessun sito su Google:
B.T.I. Bortot & Toffoli · Ceschin Impianti Elettrici · Lattonieri Gatti · Ideral di Corbanese · Idrotermica Fiorin & De Ronchi · Imad al King · Laura Valentini Parrucchieri · La Diva Parrucchieri · Lepa Idraulica · Edil Corsaro.

## 7. File prodotti (repo)

- `production_workflow.ts` — codice SDK del workflow di produzione v2.
- `serper_match_test.ts` — codice SDK del workflow di test (PG+Serper+match) usato per la raccolta.
- `prototipo_match.py` — prototipo offline che ha prodotto i numeri qui sopra.
- `fixtures/serper_sample.json` — 50 risposte Serper reali (grezze, trimmate).
- `fixtures/classificati_v2.json` — 50 aziende classificate (output v2).

## 8. Limite noto che pesa sulla produzione (§3.1 Fase 1)

**AWS WAF su PagineGialle.** Dopo poche richieste ravvicinate dallo stesso IP (quello del server n8n, un datacenter), PagineGialle risponde con un challenge JS (`HTTP 202`, `x-amzn-waf-action: challenge`) e blocca **tutte** le pagine finché non passa un periodo di raffreddamento. Osservato dal vivo: primo giro 5/6 OK, dopo alcuni run consecutivi 0/6.

Conseguenze e mitigazioni nel workflow di produzione:
- Il nodo **Estrai aziende rileva il challenge e lancia un errore chiaro** invece di scrivere righe vuote (niente lead falsati).
- Batch a 2 s tra le richieste (una sola pagina per ricerca per ora).
- **Paginazione (P5) parcheggiata**: aumenterebbe le richieste e quindi i blocchi. Da affrontare solo con una mitigazione robusta (proxy residenziale o browser headless per risolvere il challenge) — entrambe fuori dal vincolo 0 €. È il vero collo di bottiglia di scalabilità, da decidere a parte.
