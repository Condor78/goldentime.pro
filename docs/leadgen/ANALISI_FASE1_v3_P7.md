# FASE 1 v3 — Analisi + prototipo offline con P7 (Cellulare/Fisso)

**Data:** 2026-09-13 · Metodo §8 (analisi dati reali → prototipo offline → misura 50). **Nessun file di produzione toccato.**

## Dati reali usati
- Raccolti via collector n8n temporaneo (poi archiviato): 6 pagine PagineGialle (Conegliano + Catania × elettricisti/idraulici/parrucchieri), catturando **tutti** i `contactPoint[].telephone` per azienda (necessario per P7).
- Serper `/places` reale per il campione (1 chiamata/azienda).
- Fixtures: `fixtures/pg_serper_v3.json` (grezzo, tutti i telefoni + places), `fixtures/classificati_v3.json` (output).
- Prototipo offline: `prototipo_match_v3.py`.

## Prototipo (offline, no n8n)
1. **P7 split telefoni:** normalizzo (cifre, +39), parte nazionale `3…`→**Cellulare**, `0…`→**Fisso**, `800/803…`→**Fisso**; più numeri uniti da ` / `; dedup.
2. **match_confidence v2:** telefono uguale (qualsiasi dei numeri) OPPURE via+CAP/comune OPPURE via+nome → **CERTO**; nome+CAP/comune → **PROBABILE**; altrimenti nessuno.
3. **4 stati:** solo un match **CERTO** senza `website` Google → `SENZA_SITO_CONFERMATO`.

## Misura sul campione (N=50)
| Stato | n | % |
|---|---|---|
| SENZA_SITO_CONFERMATO | 10 | 20% |
| SITO_PRESENTE | 23 | 46% |
| DA_VERIFICARE | 6 | 12% |
| NON_SU_MAPS | 11 | 22% |

P7: 30 aziende con 1 telefono, 16 con 2, 4 con 3. Con cellulare 32, con fisso 20.

## Criteri §9
| Criterio | Esito |
|---|---|
| 0 falsi `SENZA_SITO_CONFERMATO` (50 campioni) | ✅ 10/10 match coerenti (telefono/via+CAP), nessun sito su Google |
| `DA_VERIFICARE` ≤ 25% | ✅ 12% |
| Telefono + indirizzo ≥ 95% | ✅ 100% |
| ≤ 1 credito Serper/azienda | ✅ 1 chiamata/azienda |
| P7 Cellulare/Fisso | ✅ split corretto sul campione |

**P1 + P2 + P3 superano §9** (con P7 incluso). → Via libera al deploy (§8.4), UN solo aggiornamento.

## Caveat onesto
"Nessun sito" = assenza del campo `website` in Google + match azienda corretto (definizione operativa del brief). Verifica umana finale consigliata sui `SENZA_SITO_CONFERMATO` prima dell'outreach.
