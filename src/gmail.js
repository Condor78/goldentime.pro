const { google } = require('googleapis');
const db = require('./db');
const { parseKrossbookingEmail, upsertParsedBooking } = require('./parser');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function makeOAuthClient() {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REDIRECT_URI) {
    throw new Error('Gmail OAuth non configurato: imposta GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI in .env');
  }
  const client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI);

  const row = db.prepare('SELECT * FROM gmail_tokens WHERE id = 1').get();
  if (row) {
    client.setCredentials({
      access_token: row.access_token || undefined,
      refresh_token: row.refresh_token || undefined,
      scope: row.scope || undefined,
      token_type: row.token_type || undefined,
      expiry_date: row.expiry_date || undefined,
    });
  }

  client.on('tokens', (tokens) => {
    const merged = { ...client.credentials, ...tokens };
    saveTokens(merged, row?.email);
  });

  return client;
}

function saveTokens(tokens, email) {
  const exists = db.prepare('SELECT 1 FROM gmail_tokens WHERE id = 1').get();
  if (exists) {
    db.prepare(`
      UPDATE gmail_tokens SET
        access_token = COALESCE(?, access_token),
        refresh_token = COALESCE(?, refresh_token),
        scope = COALESCE(?, scope),
        token_type = COALESCE(?, token_type),
        expiry_date = COALESCE(?, expiry_date),
        email = COALESCE(?, email),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      tokens.access_token || null,
      tokens.refresh_token || null,
      tokens.scope || null,
      tokens.token_type || null,
      tokens.expiry_date || null,
      email || null,
    );
  } else {
    db.prepare(`
      INSERT INTO gmail_tokens (id, access_token, refresh_token, scope, token_type, expiry_date, email)
      VALUES (1, ?, ?, ?, ?, ?, ?)
    `).run(
      tokens.access_token || null,
      tokens.refresh_token || null,
      tokens.scope || null,
      tokens.token_type || null,
      tokens.expiry_date || null,
      email || null,
    );
  }
}

function getAuthUrl() {
  const client = makeOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

async function handleOAuthCallback(code) {
  const client = makeOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // recupera email account
  let email = null;
  try {
    const gmail = google.gmail({ version: 'v1', auth: client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    email = profile.data.emailAddress || null;
  } catch (_) {}

  saveTokens(tokens, email);
  return { email };
}

function decodeBody(payload) {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (Array.isArray(payload.parts)) {
    // preferisci text/plain, poi text/html
    const plain = payload.parts.find(p => p.mimeType === 'text/plain');
    if (plain) return decodeBody(plain);
    const html = payload.parts.find(p => p.mimeType === 'text/html');
    if (html) {
      const raw = decodeBody(html);
      return raw.replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"');
    }
    // ricorsione su parti annidate
    for (const p of payload.parts) {
      const sub = decodeBody(p);
      if (sub) return sub;
    }
  }
  return '';
}

async function syncRecentBookings({ query, max = 50 } = {}) {
  const client = makeOAuthClient();
  if (!client.credentials || (!client.credentials.access_token && !client.credentials.refresh_token)) {
    throw new Error('Gmail non autenticato. Visita /api/gmail/auth per autorizzare.');
  }
  const gmail = google.gmail({ version: 'v1', auth: client });

  const q = query || process.env.GMAIL_SEARCH_QUERY || 'from:(krossbooking) newer_than:90d';

  const listResp = await gmail.users.messages.list({ userId: 'me', q, maxResults: max });
  const messages = listResp.data.messages || [];

  const result = { fetched: messages.length, parsed: 0, skipped: 0, errors: [], bookings: [] };

  for (const m of messages) {
    try {
      const detail = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      const headers = detail.data.payload?.headers || [];
      const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
      const body = decodeBody(detail.data.payload);

      const parsed = parseKrossbookingEmail({ subject, body, emailId: m.id });
      if (!parsed) {
        result.skipped++;
        continue;
      }
      const id = upsertParsedBooking(parsed, `SUBJECT: ${subject}\n\n${body}`);
      result.parsed++;
      result.bookings.push({ id, ...parsed });
    } catch (err) {
      result.errors.push({ id: m.id, message: err.message });
    }
  }

  return result;
}

function getStatus() {
  const row = db.prepare('SELECT email, updated_at, refresh_token IS NOT NULL AS has_refresh FROM gmail_tokens WHERE id = 1').get();
  return {
    configured: !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REDIRECT_URI),
    connected: !!(row && row.has_refresh),
    email: row?.email || null,
    last_update: row?.updated_at || null,
  };
}

module.exports = { getAuthUrl, handleOAuthCallback, syncRecentBookings, getStatus };
