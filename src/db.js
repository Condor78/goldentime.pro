const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'goldentime.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS apartments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  max_pax INTEGER NOT NULL,
  beds_count INTEGER NOT NULL,
  has_sofa_bed INTEGER NOT NULL DEFAULT 0,
  is_combo INTEGER NOT NULL DEFAULT 0,
  combo_of TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_cost REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  apartment_id INTEGER NOT NULL REFERENCES apartments(id),
  guest_name TEXT,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  pax_adults INTEGER NOT NULL DEFAULT 0,
  pax_children INTEGER NOT NULL DEFAULT 0,
  pax_total INTEGER NOT NULL DEFAULT 0,
  has_cot INTEGER NOT NULL DEFAULT 0,
  extra_cot_w2 INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  raw_email_id TEXT,
  raw_text TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_checkin ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_apartment ON bookings(apartment_id);

CREATE TABLE IF NOT EXISTS booking_supplies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),
  qty_planned INTEGER NOT NULL DEFAULT 0,
  qty_delivered INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  UNIQUE(booking_id, item_id)
);

CREATE TABLE IF NOT EXISTS non_conforming (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  apartment_id INTEGER REFERENCES apartments(id),
  item_id INTEGER NOT NULL REFERENCES items(id),
  qty INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_nc_reported ON non_conforming(reported_at);

CREATE TABLE IF NOT EXISTS gmail_tokens (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  token_type TEXT,
  expiry_date INTEGER,
  email TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM apartments').get().n;
  if (count > 0) return;

  const insApt = db.prepare(`
    INSERT INTO apartments (code, name, max_pax, beds_count, has_sofa_bed, is_combo, combo_of, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insApt.run('W1', 'Wanderlust 1', 6, 3, 1, 0, null, '2 letti matrimoniali + 1 divano letto matrimoniale');
  insApt.run('W2', 'Wanderlust 2', 6, 3, 1, 0, null, '2 letti matrimoniali + 1 divano letto matrimoniale. 7° pax su lettino: gestione interna, non contare.');
  insApt.run('W12', 'Wanderlust 1+2 (combo)', 12, 6, 1, 1, 'W1,W2', 'Annuncio combinato. Dotazione = somma W1 + W2.');

  const insItem = db.prepare('INSERT INTO items (code, name, category, unit_cost) VALUES (?, ?, ?, ?)');
  insItem.run('sheet_double', 'Lenzuolo matrimoniale', 'biancheria', 0);
  insItem.run('pillowcase', 'Federa', 'biancheria', 0);
  insItem.run('towel_large', 'Telo grande (doccia)', 'asciugamani', 0);
  insItem.run('towel_medium', 'Telo medio (viso)', 'asciugamani', 0);
  insItem.run('bath_mat', 'Tappeto scendi-doccia', 'bagno', 0);
}

seedIfEmpty();

module.exports = db;
