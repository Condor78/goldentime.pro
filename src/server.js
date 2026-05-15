require('dotenv').config();
const path = require('node:path');
const express = require('express');
const db = require('./db');
const supplies = require('./supplies');
const gmail = require('./gmail');
const { parseKrossbookingEmail, upsertParsedBooking } = require('./parser');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- Apartments ----------
app.get('/api/apartments', (req, res) => {
  const rows = db.prepare('SELECT * FROM apartments ORDER BY code').all();
  res.json(rows);
});

// ---------- Items ----------
app.get('/api/items', (req, res) => {
  const rows = db.prepare('SELECT * FROM items ORDER BY category, name').all();
  res.json(rows);
});

app.patch('/api/items/:id', (req, res) => {
  const { unit_cost } = req.body || {};
  if (typeof unit_cost !== 'number') return res.status(400).json({ error: 'unit_cost richiesto' });
  db.prepare('UPDATE items SET unit_cost = ? WHERE id = ?').run(unit_cost, req.params.id);
  res.json({ ok: true });
});

// ---------- Bookings ----------
app.get('/api/bookings', (req, res) => {
  const { from, to, apartment_code } = req.query;
  const where = [];
  const params = [];
  if (from) { where.push('b.check_out >= ?'); params.push(from); }
  if (to) { where.push('b.check_in <= ?'); params.push(to); }
  if (apartment_code) { where.push('a.code = ?'); params.push(apartment_code); }
  const sql = `
    SELECT b.*, a.code AS apartment_code, a.name AS apartment_name, a.is_combo
    FROM bookings b JOIN apartments a ON a.id = b.apartment_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY b.check_in DESC, b.id DESC
    LIMIT 500
  `;
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/bookings/:id', (req, res) => {
  const b = db.prepare(`
    SELECT b.*, a.code AS apartment_code, a.name AS apartment_name, a.is_combo, a.combo_of
    FROM bookings b JOIN apartments a ON a.id = b.apartment_id
    WHERE b.id = ?
  `).get(req.params.id);
  if (!b) return res.status(404).json({ error: 'Not found' });

  const sups = db.prepare(`
    SELECT bs.*, i.code AS item_code, i.name AS item_name, i.category
    FROM booking_supplies bs JOIN items i ON i.id = bs.item_id
    WHERE bs.booking_id = ?
    ORDER BY i.category, i.name
  `).all(b.id);

  const nc = db.prepare(`
    SELECT nc.*, i.code AS item_code, i.name AS item_name
    FROM non_conforming nc JOIN items i ON i.id = nc.item_id
    WHERE nc.booking_id = ?
    ORDER BY nc.reported_at DESC
  `).all(b.id);

  res.json({ booking: b, supplies: sups, non_conforming: nc });
});

app.post('/api/bookings', (req, res) => {
  const { apartment_code, guest_name, check_in, check_out, pax_adults = 0, pax_children = 0,
          pax_total, has_cot = 0, extra_cot_w2 = 0, notes = null } = req.body || {};
  if (!apartment_code || !check_in || !check_out) return res.status(400).json({ error: 'apartment_code, check_in, check_out richiesti' });
  const apt = db.prepare('SELECT id FROM apartments WHERE code = ?').get(apartment_code);
  if (!apt) return res.status(400).json({ error: 'Appartamento non trovato' });

  const total = typeof pax_total === 'number' ? pax_total : (pax_adults + pax_children);
  const info = db.prepare(`
    INSERT INTO bookings (source, apartment_id, guest_name, check_in, check_out,
                          pax_adults, pax_children, pax_total, has_cot, extra_cot_w2, notes)
    VALUES ('manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(apt.id, guest_name || null, check_in, check_out,
         pax_adults, pax_children, total, has_cot ? 1 : 0, extra_cot_w2 ? 1 : 0, notes);
  res.json({ id: info.lastInsertRowid });
});

app.patch('/api/bookings/:id', (req, res) => {
  const allowed = ['guest_name', 'check_in', 'check_out', 'pax_adults', 'pax_children',
                   'pax_total', 'has_cot', 'extra_cot_w2', 'notes', 'apartment_id'];
  const sets = [];
  const params = [];
  for (const k of allowed) {
    if (k in (req.body || {})) {
      sets.push(`${k} = ?`);
      params.push(req.body[k]);
    }
  }
  if (!sets.length) return res.json({ ok: true });
  params.push(req.params.id);
  db.prepare(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

app.delete('/api/bookings/:id', (req, res) => {
  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Compute & persist supplies ----------
app.post('/api/bookings/:id/compute', (req, res) => {
  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!b) return res.status(404).json({ error: 'Not found' });
  try {
    const { breakdown, total } = supplies.computeSuppliesForBooking(b, req.body?.split);
    if (req.body?.persist) supplies.persistPlannedSupplies(b.id, total);
    res.json({ breakdown, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/booking-supplies/:id', (req, res) => {
  const { qty_delivered, notes } = req.body || {};
  const sets = [];
  const params = [];
  if (typeof qty_delivered === 'number') { sets.push('qty_delivered = ?'); params.push(qty_delivered); }
  if (typeof notes === 'string') { sets.push('notes = ?'); params.push(notes); }
  if (!sets.length) return res.json({ ok: true });
  params.push(req.params.id);
  db.prepare(`UPDATE booking_supplies SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

// ---------- Non conforming ----------
app.get('/api/non-conforming', (req, res) => {
  const { from, to } = req.query;
  const where = [];
  const params = [];
  if (from) { where.push("nc.reported_at >= ?"); params.push(from); }
  if (to) { where.push("nc.reported_at <= ?"); params.push(to + ' 23:59:59'); }
  const sql = `
    SELECT nc.*, i.code AS item_code, i.name AS item_name,
           a.code AS apartment_code, b.guest_name
    FROM non_conforming nc
    JOIN items i ON i.id = nc.item_id
    LEFT JOIN bookings b ON b.id = nc.booking_id
    LEFT JOIN apartments a ON a.id = COALESCE(nc.apartment_id, b.apartment_id)
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY nc.reported_at DESC LIMIT 500
  `;
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/non-conforming', (req, res) => {
  const { booking_id = null, apartment_code = null, item_code, qty, reason, notes = null } = req.body || {};
  if (!item_code || !qty || !reason) return res.status(400).json({ error: 'item_code, qty, reason richiesti' });
  const item = db.prepare('SELECT id FROM items WHERE code = ?').get(item_code);
  if (!item) return res.status(400).json({ error: 'Articolo non trovato' });

  let apartment_id = null;
  if (apartment_code) {
    const a = db.prepare('SELECT id FROM apartments WHERE code = ?').get(apartment_code);
    if (a) apartment_id = a.id;
  }
  const info = db.prepare(`
    INSERT INTO non_conforming (booking_id, apartment_id, item_id, qty, reason, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(booking_id, apartment_id, item.id, qty, reason, notes);
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/non-conforming/:id', (req, res) => {
  db.prepare('DELETE FROM non_conforming WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Reports ----------
app.get('/api/reports/consumption', (req, res) => {
  const { from, to, apartment_code } = req.query;
  const where = ['1=1'];
  const params = [];
  if (from) { where.push('b.check_in >= ?'); params.push(from); }
  if (to) { where.push('b.check_in <= ?'); params.push(to); }
  if (apartment_code) { where.push('a.code = ?'); params.push(apartment_code); }
  const sql = `
    SELECT i.code AS item_code, i.name AS item_name,
           SUM(bs.qty_planned) AS total_planned,
           SUM(bs.qty_delivered) AS total_delivered
    FROM booking_supplies bs
    JOIN bookings b ON b.id = bs.booking_id
    JOIN apartments a ON a.id = b.apartment_id
    JOIN items i ON i.id = bs.item_id
    WHERE ${where.join(' AND ')}
    GROUP BY i.id ORDER BY i.category, i.name
  `;
  const consumption = db.prepare(sql).all(...params);

  const ncSql = `
    SELECT i.code AS item_code, i.name AS item_name, SUM(nc.qty) AS total_nc
    FROM non_conforming nc
    JOIN items i ON i.id = nc.item_id
    LEFT JOIN bookings b ON b.id = nc.booking_id
    LEFT JOIN apartments a ON a.id = COALESCE(nc.apartment_id, b.apartment_id)
    WHERE 1=1
      ${from ? 'AND nc.reported_at >= ?' : ''}
      ${to ? "AND nc.reported_at <= ?" : ''}
      ${apartment_code ? 'AND a.code = ?' : ''}
    GROUP BY i.id ORDER BY i.code
  `;
  const ncParams = [];
  if (from) ncParams.push(from);
  if (to) ncParams.push(to + ' 23:59:59');
  if (apartment_code) ncParams.push(apartment_code);
  const non_conforming = db.prepare(ncSql).all(...ncParams);

  res.json({ consumption, non_conforming });
});

// ---------- Gmail ----------
app.get('/api/gmail/status', (req, res) => {
  res.json(gmail.getStatus());
});

app.get('/api/gmail/auth', (req, res) => {
  try {
    res.redirect(gmail.getAuthUrl());
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/api/gmail/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.status(400).send(`Errore OAuth: ${error}`);
  if (!code) return res.status(400).send('Codice OAuth mancante');
  try {
    const { email } = await gmail.handleOAuthCallback(code);
    res.redirect(`/?gmail_connected=1&email=${encodeURIComponent(email || '')}`);
  } catch (err) {
    res.status(500).send('Errore OAuth: ' + err.message);
  }
});

app.post('/api/gmail/sync', async (req, res) => {
  try {
    const { query, max } = req.body || {};
    const result = await gmail.syncRecentBookings({ query, max: max || 50 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import manuale (incollare il corpo della mail KrossBooking)
app.post('/api/bookings/import-text', (req, res) => {
  const { subject = '', body = '' } = req.body || {};
  const parsed = parseKrossbookingEmail({ subject, body, emailId: null });
  if (!parsed) return res.status(422).json({ error: 'Impossibile estrarre prenotazione: servono almeno appartamento + date.' });
  try {
    const id = upsertParsedBooking(parsed, `SUBJECT: ${subject}\n\n${body}`);
    res.json({ id, parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GoldenTime Linen pronto su http://localhost:${PORT}`);
});
