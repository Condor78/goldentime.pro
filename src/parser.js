const db = require('./db');

/**
 * Parser euristico per email KrossBooking.
 * Tollerante a varianti italiano/inglese. Restituisce un oggetto con i campi
 * principali oppure null se non riesce a estrarre l'essenziale (date + appartamento).
 */

const MONTHS_IT = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
  luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
  gen: 1, feb: 2, mar: 3, apr: 4, mag: 5, giu: 6, lug: 7, ago: 8, set: 9, ott: 10, nov: 11, dic: 12,
};

function normalize(text) {
  return (text || '')
    .replace(/\r\n/g, '\n')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ');
}

function parseDate(raw) {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();

  // ISO yyyy-mm-dd
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;

  // dd/mm/yyyy or dd-mm-yyyy
  m = s.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (m) {
    const dd = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');
    let yy = m[3];
    if (yy.length === 2) yy = '20' + yy;
    return `${yy}-${mm}-${dd}`;
  }

  // "12 luglio 2025" / "12 lug 2025"
  m = s.match(/(\d{1,2})\s+([a-zà-ÿ]{3,})\s+(\d{4})/);
  if (m && MONTHS_IT[m[2]]) {
    const dd = String(m[1]).padStart(2, '0');
    const mm = String(MONTHS_IT[m[2]]).padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  }
  return null;
}

function pickApartment(text) {
  const t = text.toLowerCase();
  // Cerchiamo Wanderlust 1, Wanderlust 2, Wanderlust 12 / 1+2
  if (/wanderlust\s*1\s*\+\s*2|wanderlust\s*12\b|w1\s*\+\s*w2|w12\b/i.test(text)) return 'W12';
  if (/wanderlust\s*2\b|\bw2\b/i.test(text)) return 'W2';
  if (/wanderlust\s*1\b|\bw1\b/i.test(text)) return 'W1';
  return null;
}

function findField(text, labels) {
  // labels: array di alternative; restituisce il valore dopo "label:" sulla stessa riga.
  // Le label sono ancorate a word-boundary per evitare match dentro altre parole
  // (es. "to" dentro "appartamento"). Pretendiamo anche un separatore esplicito
  // (": # -" o spazi multipli) tra label e valore.
  const alt = labels.map(l => `\\b(?:${l})\\b`).join('|');
  const pattern = new RegExp(`(?:${alt})\\s*[:#]\\s*([^\\n\\r]+)`, 'i');
  const m = text.match(pattern);
  return m ? m[1].trim() : null;
}

function findNumber(text, labels) {
  const v = findField(text, labels);
  if (!v) return null;
  const m = v.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function hasCot(text) {
  return /\b(culla|culle|cot|crib|baby\s*cot)\b/i.test(text);
}

function parseKrossbookingEmail({ subject = '', body = '', emailId = null }) {
  const text = normalize(`${subject}\n${body}`);

  const apartmentCode = pickApartment(text);
  const checkInRaw = findField(text, ['check[- ]?in', 'arrivo', 'data di arrivo', 'from', 'dal']);
  const checkOutRaw = findField(text, ['check[- ]?out', 'partenza', 'data di partenza', 'to', 'al']);
  const checkIn = parseDate(checkInRaw || '');
  const checkOut = parseDate(checkOutRaw || '');

  const guestName = findField(text, ['ospite', 'cliente', 'nome', 'guest', 'guest name']) || null;

  let adults = findNumber(text, ['adulti', 'adults']);
  let children = findNumber(text, ['bambini', 'children', 'kids']);
  const totalGuests = findNumber(text, ['ospiti totali', 'numero ospiti', 'numero persone', 'pax', 'guests', 'totale ospiti']);

  if (adults == null && children == null && totalGuests != null) {
    adults = totalGuests;
    children = 0;
  }
  if (adults == null) adults = 0;
  if (children == null) children = 0;
  const paxTotal = totalGuests != null ? totalGuests : adults + children;

  const sourceId = findField(text, ['codice prenotazione', 'codice', 'reservation code', 'booking code', 'id prenotazione', 'reservation id']);

  if (!apartmentCode || !checkIn || !checkOut) {
    return null; // non parsabile
  }

  return {
    source: 'krossbooking',
    source_id: sourceId || (emailId ? `mail:${emailId}` : null),
    apartment_code: apartmentCode,
    guest_name: guestName,
    check_in: checkIn,
    check_out: checkOut,
    pax_adults: adults,
    pax_children: children,
    pax_total: paxTotal,
    has_cot: hasCot(text) ? 1 : 0,
    raw_email_id: emailId,
  };
}

/**
 * Upsert prenotazione dal payload del parser. Se già esiste (source+source_id),
 * aggiorna i campi non manuali. Ritorna l'id.
 */
function upsertParsedBooking(parsed, rawText) {
  const apt = db.prepare('SELECT id FROM apartments WHERE code = ?').get(parsed.apartment_code);
  if (!apt) throw new Error(`Apartment ${parsed.apartment_code} not configured`);

  if (parsed.source_id) {
    const existing = db.prepare('SELECT id FROM bookings WHERE source = ? AND source_id = ?').get(parsed.source, parsed.source_id);
    if (existing) {
      db.prepare(`
        UPDATE bookings SET
          apartment_id = ?, guest_name = COALESCE(?, guest_name),
          check_in = ?, check_out = ?,
          pax_adults = ?, pax_children = ?, pax_total = ?,
          has_cot = ?, raw_email_id = COALESCE(?, raw_email_id),
          raw_text = COALESCE(?, raw_text)
        WHERE id = ?
      `).run(
        apt.id, parsed.guest_name,
        parsed.check_in, parsed.check_out,
        parsed.pax_adults, parsed.pax_children, parsed.pax_total,
        parsed.has_cot, parsed.raw_email_id, rawText || null,
        existing.id
      );
      return existing.id;
    }
  }

  const info = db.prepare(`
    INSERT INTO bookings (source, source_id, apartment_id, guest_name, check_in, check_out,
                          pax_adults, pax_children, pax_total, has_cot, raw_email_id, raw_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    parsed.source, parsed.source_id, apt.id, parsed.guest_name,
    parsed.check_in, parsed.check_out,
    parsed.pax_adults, parsed.pax_children, parsed.pax_total,
    parsed.has_cot, parsed.raw_email_id, rawText || null
  );
  return info.lastInsertRowid;
}

module.exports = { parseKrossbookingEmail, upsertParsedBooking };
