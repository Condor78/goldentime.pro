const db = require('./db');

const ITEM_CODES = ['sheet_double', 'pillowcase', 'towel_large', 'towel_medium', 'bath_mat'];

function getItemsByCode() {
  const rows = db.prepare(`SELECT id, code FROM items WHERE code IN (${ITEM_CODES.map(() => '?').join(',')})`).all(...ITEM_CODES);
  const map = {};
  for (const r of rows) map[r.code] = r.id;
  return map;
}

/**
 * Calcola la dotazione standard per UN appartamento.
 * Regole:
 *  - tutti i letti sono matrimoniali; n_letti = ceil(pax / 2), max apartment.beds_count
 *  - 2 lenzuola + 2 federe per letto
 *  - 1 telo grande + 1 telo medio per persona
 *  - 1 tappeto scendi-doccia per prenotazione
 *  - culla: NON conta (gestione interna)
 *  - lettino extra W2 (7° pax): NON conta (gestione interna)
 */
function computeSuppliesForApartment(apartment, paxToCount) {
  const beds = Math.min(Math.ceil(paxToCount / 2), apartment.beds_count);
  return {
    sheet_double: beds * 2,
    pillowcase: beds * 2,
    towel_large: paxToCount,
    towel_medium: paxToCount,
    bath_mat: 1,
    _beds_used: beds,
  };
}

/**
 * Calcolo dotazione per una prenotazione, gestendo:
 *  - W12 combo => somma W1 + W2 (split pax: come da `split` o equa)
 *  - extra_cot_w2 (lettino 7° pax): rimosso dal conteggio
 *  - has_cot (culla): rimosso dal conteggio (assumiamo 1 bambino in culla)
 */
function computeSuppliesForBooking(booking, split) {
  const apartment = db.prepare('SELECT * FROM apartments WHERE id = ?').get(booking.apartment_id);
  if (!apartment) throw new Error('Apartment not found');

  // pax effettivi: totale - eventuale lettino interno W2 - eventuale culla
  let paxBillable = booking.pax_total - (booking.extra_cot_w2 ? 1 : 0) - (booking.has_cot ? 1 : 0);
  if (paxBillable < 0) paxBillable = 0;

  if (!apartment.is_combo) {
    const supplies = computeSuppliesForApartment(apartment, paxBillable);
    return { breakdown: [{ apartment, paxBillable, supplies }], total: supplies };
  }

  // Combo W12: distribuzione su W1 e W2
  const childCodes = (apartment.combo_of || '').split(',').map(s => s.trim()).filter(Boolean);
  const children = childCodes.map(code => db.prepare('SELECT * FROM apartments WHERE code = ?').get(code)).filter(Boolean);
  if (children.length === 0) throw new Error('Combo apartment has no children');

  const splitMap = split && typeof split === 'object' ? split : {};
  // default: pax equi (resto sul primo)
  const baseShare = Math.floor(paxBillable / children.length);
  const remainder = paxBillable % children.length;
  const distribution = children.map((c, i) => ({
    apartment: c,
    paxBillable: typeof splitMap[c.code] === 'number'
      ? Math.max(0, splitMap[c.code])
      : baseShare + (i < remainder ? 1 : 0),
  }));

  const total = { sheet_double: 0, pillowcase: 0, towel_large: 0, towel_medium: 0, bath_mat: 0, _beds_used: 0 };
  const breakdown = distribution.map(d => {
    const s = computeSuppliesForApartment(d.apartment, d.paxBillable);
    for (const k of Object.keys(total)) total[k] += s[k];
    return { ...d, supplies: s };
  });
  return { breakdown, total };
}

/**
 * Persiste la dotazione planned su DB (sovrascrive righe esistenti).
 */
function persistPlannedSupplies(bookingId, totals) {
  const items = getItemsByCode();
  const upsert = db.prepare(`
    INSERT INTO booking_supplies (booking_id, item_id, qty_planned, qty_delivered)
    VALUES (?, ?, ?, 0)
    ON CONFLICT(booking_id, item_id) DO UPDATE SET qty_planned = excluded.qty_planned
  `);
  const tx = db.transaction(() => {
    for (const code of ITEM_CODES) {
      const itemId = items[code];
      if (!itemId) continue;
      upsert.run(bookingId, itemId, totals[code] || 0);
    }
  });
  tx();
}

module.exports = {
  computeSuppliesForApartment,
  computeSuppliesForBooking,
  persistPlannedSupplies,
  ITEM_CODES,
  getItemsByCode,
};
