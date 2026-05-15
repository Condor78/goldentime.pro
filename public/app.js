// ---------- Helpers ----------
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

function toast(msg, kind = '') {
  const div = document.createElement('div');
  div.className = 'toast ' + kind;
  div.textContent = msg;
  $('#toast').appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function daysBetween(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db - da) / 86400000);
}

// ---------- Modal ----------
function openModal(html) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="modal-backdrop"><div class="modal">${html}</div></div>`;
  root.querySelector('.modal-backdrop').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });
  return root.querySelector('.modal');
}
function closeModal() { $('#modal-root').innerHTML = ''; }

// ---------- State ----------
const state = {
  apartments: [],
  items: [],
  bookings: [],
};

// ---------- Tabs ----------
$$('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.view').forEach(v => v.classList.remove('active'));
    $('#view-' + btn.dataset.view).classList.add('active');
    routeView(btn.dataset.view);
  });
});

async function routeView(view) {
  if (view === 'dashboard') loadDashboard();
  if (view === 'bookings') loadBookings();
  if (view === 'non-conforming') loadNonConforming();
  if (view === 'reports') {}
  if (view === 'apartments') loadApartmentsTable();
  if (view === 'gmail') loadGmailDetail();
}

// ---------- Bootstrap ----------
(async function init() {
  try {
    state.apartments = await api('/api/apartments');
    state.items = await api('/api/items');
    populateAptSelects();
    populateItemSelects();
    loadDashboard();
    handleGmailCallbackParam();
  } catch (e) {
    toast('Errore init: ' + e.message, 'err');
  }
})();

function populateAptSelects() {
  const sels = ['#filter-apt', '#rep-apt', 'select[name="apartment_code"]'];
  sels.forEach(sel => {
    $$(sel).forEach(node => {
      const current = node.value;
      const keepEmpty = node.querySelector('option[value=""]');
      node.innerHTML = '';
      if (keepEmpty) node.appendChild(keepEmpty.cloneNode(true));
      state.apartments.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.code;
        opt.textContent = `${a.code} - ${a.name}`;
        node.appendChild(opt);
      });
      node.value = current;
    });
  });
}

function populateItemSelects() {
  $$('select[name="item_code"]').forEach(node => {
    node.innerHTML = '';
    state.items.forEach(i => {
      const opt = document.createElement('option');
      opt.value = i.code;
      opt.textContent = i.name;
      node.appendChild(opt);
    });
  });
}

// ---------- Dashboard ----------
async function loadDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const bookings = await api(`/api/bookings?from=${today}&to=${in7}`);
  const upcoming = bookings
    .filter(b => b.check_in >= today && b.check_in <= in7)
    .sort((a, b) => a.check_in.localeCompare(b.check_in));
  const container = $('#upcoming-checkins');
  if (upcoming.length === 0) {
    container.innerHTML = '<div class="muted">Nessun check-in nei prossimi 7 giorni.</div>';
  } else {
    container.innerHTML = upcoming.map(b => `
      <div class="list-item" data-id="${b.id}">
        <div><strong>${fmtDate(b.check_in)}</strong> - ${b.apartment_code} - ${b.guest_name || 'Ospite'}
          <span class="badge gold">${b.pax_total} pax</span>
          ${b.has_cot ? '<span class="badge gray">+ culla (interna)</span>' : ''}
          ${b.extra_cot_w2 ? '<span class="badge gray">+ lettino W2 (interno)</span>' : ''}
        </div>
        <div class="meta">${daysBetween(b.check_in, b.check_out)} notti - check-out ${fmtDate(b.check_out)}</div>
      </div>
    `).join('');
    container.querySelectorAll('.list-item').forEach(el => {
      el.addEventListener('click', () => {
        $$('.tab')[1].click();
        setTimeout(() => openBookingDetail(parseInt(el.dataset.id)), 50);
      });
    });
  }

  const status = await api('/api/gmail/status');
  $('#gmail-status-card').innerHTML = renderGmailStatus(status);
}

$('#btn-sync-now').addEventListener('click', () => syncGmail());

// ---------- Bookings ----------
async function loadBookings() {
  const from = $('#filter-from').value;
  const to = $('#filter-to').value;
  const apt = $('#filter-apt').value;
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  if (apt) qs.set('apartment_code', apt);
  state.bookings = await api('/api/bookings?' + qs.toString());

  $('#bookings-table').innerHTML = `
    <table>
      <thead><tr>
        <th>#</th><th>App.</th><th>Ospite</th><th>Check-in</th><th>Check-out</th>
        <th>Pax</th><th>Note</th><th>Origine</th><th></th>
      </tr></thead>
      <tbody>
        ${state.bookings.map(b => `
          <tr data-id="${b.id}">
            <td>${b.id}</td>
            <td><strong>${b.apartment_code}</strong></td>
            <td>${b.guest_name || '-'}</td>
            <td>${fmtDate(b.check_in)}</td>
            <td>${fmtDate(b.check_out)}</td>
            <td>${b.pax_total}${b.has_cot ? ' +c' : ''}${b.extra_cot_w2 ? ' +l' : ''}</td>
            <td class="muted">${b.notes || ''}</td>
            <td><span class="badge ${b.source === 'krossbooking' ? 'gold' : 'gray'}">${b.source}</span></td>
            <td><button class="btn small" data-action="open">Apri</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  $$('#bookings-table tr[data-id]').forEach(tr => {
    tr.querySelector('[data-action="open"]').addEventListener('click', () => {
      openBookingDetail(parseInt(tr.dataset.id));
    });
  });
}

$('#btn-filter').addEventListener('click', loadBookings);

async function openBookingDetail(id) {
  const data = await api('/api/bookings/' + id);
  const b = data.booking;
  const sec = $('#booking-detail');
  sec.style.display = 'block';
  $('#bd-title').textContent = `#${b.id} - ${b.apartment_code} - ${b.guest_name || 'Ospite'}`;

  const supplyTable = data.supplies.length === 0
    ? '<div class="muted">Nessuna dotazione calcolata. Premi "Calcola dotazione".</div>'
    : `
      <div class="supply-row head"><div>Articolo</div><div>Previsti</div><div>Consegnati</div></div>
      ${data.supplies.map(s => `
        <div class="supply-row">
          <div>${s.item_name}</div>
          <div>${s.qty_planned}</div>
          <div><input type="number" min="0" value="${s.qty_delivered}" data-bs-id="${s.id}" class="bs-delivered" style="width:80px;"/></div>
        </div>
      `).join('')}
    `;

  const ncTable = data.non_conforming.length === 0
    ? '<div class="muted">Nessun non conforme registrato per questa prenotazione.</div>'
    : `<table><thead><tr><th>Data</th><th>Articolo</th><th>Q.tà</th><th>Motivo</th><th>Note</th></tr></thead>
       <tbody>${data.non_conforming.map(n => `
         <tr><td>${n.reported_at}</td><td>${n.item_name}</td><td>${n.qty}</td><td>${n.reason}</td><td>${n.notes || ''}</td></tr>
       `).join('')}</tbody></table>`;

  let comboSplitUI = '';
  if (b.is_combo) {
    const codes = (b.combo_of || '').split(',').map(s => s.trim()).filter(Boolean);
    comboSplitUI = `
      <div class="card" style="background:var(--gold-soft);">
        <strong>Combo W12 - distribuzione pax</strong>
        <div class="row" style="margin-top:8px;">
          ${codes.map(c => `<label class="muted">${c}: <input type="number" min="0" value="" id="split-${c}" style="width:64px;" /></label>`).join('')}
          <span class="muted">Lascia vuoto per distribuzione automatica</span>
        </div>
      </div>`;
  }

  $('#bd-content').innerHTML = `
    <div class="row">
      <div class="flex-1">
        <p>
          <strong>${fmtDate(b.check_in)}</strong> → <strong>${fmtDate(b.check_out)}</strong>
          (${daysBetween(b.check_in, b.check_out)} notti)<br/>
          Pax totali: <strong>${b.pax_total}</strong>
          (adulti ${b.pax_adults}, bambini ${b.pax_children})<br/>
          Culla: <label><input type="checkbox" id="bd-cot" ${b.has_cot ? 'checked' : ''}/> presente (gestione interna, non contata)</label><br/>
          Lettino W2: <label><input type="checkbox" id="bd-lett" ${b.extra_cot_w2 ? 'checked' : ''}/> 7° pax (gestione interna, non contato)</label><br/>
          Origine: <span class="badge ${b.source === 'krossbooking' ? 'gold' : 'gray'}">${b.source}</span>
          ${b.source_id ? '<span class="muted"> · ' + b.source_id + '</span>' : ''}
        </p>
        ${comboSplitUI}
        <div class="row">
          <button class="btn primary" id="btn-compute">Calcola e salva dotazione</button>
          <button class="btn" id="btn-preview">Anteprima</button>
          <button class="btn danger" id="btn-delete">Elimina</button>
        </div>
      </div>
      <div class="flex-1">
        <h3>Dotazione</h3>
        <div id="supply-table">${supplyTable}</div>
      </div>
    </div>
    <div style="margin-top:18px;">
      <h3>Non conformi collegati</h3>
      ${ncTable}
    </div>
    ${b.raw_text ? `<details style="margin-top:14px;"><summary>Email originale</summary><pre style="white-space:pre-wrap;background:#fafafa;padding:10px;border-radius:6px;">${escapeHtml(b.raw_text)}</pre></details>` : ''}
  `;

  $('#bd-cot').addEventListener('change', async (e) => {
    await api('/api/bookings/' + b.id, { method: 'PATCH', body: { has_cot: e.target.checked ? 1 : 0 } });
    toast('Aggiornato');
  });
  $('#bd-lett').addEventListener('change', async (e) => {
    await api('/api/bookings/' + b.id, { method: 'PATCH', body: { extra_cot_w2: e.target.checked ? 1 : 0 } });
    toast('Aggiornato');
  });

  function gatherSplit() {
    if (!b.is_combo) return null;
    const split = {};
    const codes = (b.combo_of || '').split(',').map(s => s.trim()).filter(Boolean);
    codes.forEach(c => {
      const v = $('#split-' + c)?.value;
      if (v !== '' && v != null) split[c] = parseInt(v, 10) || 0;
    });
    return Object.keys(split).length ? split : null;
  }

  $('#btn-preview').addEventListener('click', async () => {
    const res = await api('/api/bookings/' + b.id + '/compute', { method: 'POST', body: { split: gatherSplit() } });
    showComputePreview(res);
  });
  $('#btn-compute').addEventListener('click', async () => {
    await api('/api/bookings/' + b.id + '/compute', { method: 'POST', body: { split: gatherSplit(), persist: true } });
    toast('Dotazione salvata');
    openBookingDetail(b.id);
  });
  $('#btn-delete').addEventListener('click', async () => {
    if (!confirm('Eliminare la prenotazione?')) return;
    await api('/api/bookings/' + b.id, { method: 'DELETE' });
    sec.style.display = 'none';
    loadBookings();
    toast('Eliminata');
  });

  $$('.bs-delivered').forEach(inp => {
    inp.addEventListener('change', async () => {
      await api('/api/booking-supplies/' + inp.dataset.bsId, {
        method: 'PATCH',
        body: { qty_delivered: parseInt(inp.value, 10) || 0 },
      });
      toast('Salvato');
    });
  });
}

function showComputePreview(res) {
  const html = `
    <h3>Anteprima dotazione</h3>
    ${res.breakdown.map(bk => `
      <div><strong>${bk.apartment.code}</strong> - pax conteggiati: ${bk.paxBillable}, letti usati: ${bk.supplies._beds_used}</div>
      <div class="supply-row head"><div>Articolo</div><div>Q.tà</div><div></div></div>
      ${Object.entries(bk.supplies).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `
        <div class="supply-row"><div>${k}</div><div>${v}</div><div></div></div>
      `).join('')}
      <hr/>
    `).join('')}
    <h4>Totale</h4>
    ${Object.entries(res.total).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `
      <div class="supply-row"><div>${k}</div><div>${v}</div><div></div></div>
    `).join('')}
    <div style="margin-top:12px;"><button class="btn" id="cm-close">Chiudi</button></div>
  `;
  openModal(html);
  $('#cm-close').addEventListener('click', closeModal);
}

$('#btn-new-booking').addEventListener('click', () => {
  const aptOptions = state.apartments.map(a => `<option value="${a.code}">${a.code} - ${a.name}</option>`).join('');
  openModal(`
    <h3>Nuova prenotazione manuale</h3>
    <form id="form-new">
      <div class="grid">
        <label>Appartamento<select name="apartment_code">${aptOptions}</select></label>
        <label>Ospite<input name="guest_name" /></label>
        <label>Check-in<input type="date" name="check_in" required /></label>
        <label>Check-out<input type="date" name="check_out" required /></label>
        <label>Adulti<input type="number" name="pax_adults" value="2" min="0" /></label>
        <label>Bambini<input type="number" name="pax_children" value="0" min="0" /></label>
        <label><input type="checkbox" name="has_cot" /> Culla (gestione interna)</label>
        <label><input type="checkbox" name="extra_cot_w2" /> Lettino W2 (7° pax)</label>
        <label class="col-2">Note<input name="notes" /></label>
      </div>
      <div style="margin-top:12px;">
        <button class="btn primary">Crea</button>
        <button type="button" class="btn" id="cancel-new">Annulla</button>
      </div>
    </form>
  `);
  $('#cancel-new').addEventListener('click', closeModal);
  $('#form-new').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      apartment_code: fd.get('apartment_code'),
      guest_name: fd.get('guest_name') || null,
      check_in: fd.get('check_in'),
      check_out: fd.get('check_out'),
      pax_adults: parseInt(fd.get('pax_adults')) || 0,
      pax_children: parseInt(fd.get('pax_children')) || 0,
      has_cot: fd.get('has_cot') ? 1 : 0,
      extra_cot_w2: fd.get('extra_cot_w2') ? 1 : 0,
      notes: fd.get('notes') || null,
    };
    try {
      const r = await api('/api/bookings', { method: 'POST', body });
      closeModal();
      toast('Prenotazione creata');
      await loadBookings();
      openBookingDetail(r.id);
    } catch (err) { toast(err.message, 'err'); }
  });
});

$('#btn-import-text').addEventListener('click', () => {
  openModal(`
    <h3>Incolla email KrossBooking</h3>
    <p class="muted">Incolla soggetto e corpo della mail. L'app tenterà di estrarre i dati.</p>
    <form id="form-imp">
      <label class="muted">Soggetto</label>
      <input name="subject" style="width:100%;padding:6px;" />
      <label class="muted" style="margin-top:8px;display:block;">Corpo</label>
      <textarea name="body" rows="14" style="width:100%;font-family:monospace;"></textarea>
      <div style="margin-top:12px;">
        <button class="btn primary">Importa</button>
        <button type="button" class="btn" id="cancel-imp">Annulla</button>
      </div>
    </form>
  `);
  $('#cancel-imp').addEventListener('click', closeModal);
  $('#form-imp').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const r = await api('/api/bookings/import-text', {
        method: 'POST',
        body: { subject: fd.get('subject'), body: fd.get('body') },
      });
      closeModal();
      toast('Importata #' + r.id);
      await loadBookings();
      openBookingDetail(r.id);
    } catch (err) { toast(err.message, 'err'); }
  });
});

// ---------- Non conforming ----------
async function loadNonConforming() {
  const list = await api('/api/non-conforming');
  $('#nc-table').innerHTML = list.length === 0
    ? '<div class="muted">Nessun non conforme registrato.</div>'
    : `<table><thead><tr><th>Data</th><th>App.</th><th>Articolo</th><th>Q.tà</th><th>Motivo</th><th>Pren.</th><th>Note</th><th></th></tr></thead>
       <tbody>${list.map(n => `
         <tr>
           <td>${n.reported_at}</td>
           <td>${n.apartment_code || '-'}</td>
           <td>${n.item_name}</td>
           <td>${n.qty}</td>
           <td><span class="badge red">${n.reason}</span></td>
           <td>${n.booking_id || ''} ${n.guest_name || ''}</td>
           <td class="muted">${n.notes || ''}</td>
           <td><button class="btn small danger" data-del="${n.id}">X</button></td>
         </tr>
       `).join('')}</tbody></table>`;
  $$('[data-del]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Eliminare?')) return;
    await api('/api/non-conforming/' + b.dataset.del, { method: 'DELETE' });
    loadNonConforming();
  }));
}

$('#form-nc').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    item_code: fd.get('item_code'),
    qty: parseInt(fd.get('qty'), 10),
    reason: fd.get('reason'),
    apartment_code: fd.get('apartment_code') || null,
    booking_id: fd.get('booking_id') ? parseInt(fd.get('booking_id'), 10) : null,
    notes: fd.get('notes') || null,
  };
  try {
    await api('/api/non-conforming', { method: 'POST', body });
    e.target.reset();
    toast('Registrato');
    loadNonConforming();
  } catch (err) { toast(err.message, 'err'); }
});

// ---------- Reports ----------
$('#btn-report').addEventListener('click', async () => {
  const qs = new URLSearchParams();
  if ($('#rep-from').value) qs.set('from', $('#rep-from').value);
  if ($('#rep-to').value) qs.set('to', $('#rep-to').value);
  if ($('#rep-apt').value) qs.set('apartment_code', $('#rep-apt').value);
  const data = await api('/api/reports/consumption?' + qs.toString());
  $('#report-output').innerHTML = `
    <h3>Consumo dotazioni</h3>
    ${data.consumption.length === 0 ? '<div class="muted">Nessun dato.</div>' : `
      <table><thead><tr><th>Articolo</th><th>Previsti</th><th>Consegnati</th></tr></thead>
      <tbody>${data.consumption.map(r => `
        <tr><td>${r.item_name}</td><td>${r.total_planned || 0}</td><td>${r.total_delivered || 0}</td></tr>
      `).join('')}</tbody></table>`}
    <h3 style="margin-top:18px;">Non conformi</h3>
    ${data.non_conforming.length === 0 ? '<div class="muted">Nessun non conforme nel periodo.</div>' : `
      <table><thead><tr><th>Articolo</th><th>Quantità</th></tr></thead>
      <tbody>${data.non_conforming.map(r => `
        <tr><td>${r.item_name}</td><td>${r.total_nc || 0}</td></tr>
      `).join('')}</tbody></table>`}
  `;
});

// ---------- Apartments ----------
function loadApartmentsTable() {
  $('#apt-table').innerHTML = `
    <table><thead><tr><th>Codice</th><th>Nome</th><th>Max pax</th><th>Letti</th><th>Combo</th><th>Note</th></tr></thead>
    <tbody>${state.apartments.map(a => `
      <tr>
        <td><strong>${a.code}</strong></td>
        <td>${a.name}</td>
        <td>${a.max_pax}</td>
        <td>${a.beds_count}</td>
        <td>${a.is_combo ? `<span class="badge gold">${a.combo_of}</span>` : '-'}</td>
        <td class="muted">${a.notes || ''}</td>
      </tr>
    `).join('')}</tbody></table>
  `;
}

// ---------- Gmail ----------
function renderGmailStatus(s) {
  if (!s.configured) return '<span class="badge red">Non configurato</span><br/><span class="muted">Manca .env</span>';
  if (!s.connected) return '<span class="badge gray">Non connesso</span><br/><a href="/api/gmail/auth" class="btn small primary" style="margin-top:6px;">Connetti Gmail</a>';
  return `<span class="badge green">Connesso</span><br/><span class="muted">${s.email || ''}</span>`;
}

async function loadGmailDetail() {
  const s = await api('/api/gmail/status');
  $('#gmail-detail').innerHTML = `
    Stato: ${renderGmailStatus(s)}<br/>
    Ultimo aggiornamento token: ${s.last_update || '-'}<br/>
    Configurato: ${s.configured ? 'sì' : 'no (manca .env)'}<br/>
  `;
  $('#redirect-uri-hint').textContent = window.location.origin + '/api/gmail/callback';
  $('#btn-gmail-connect').style.display = s.configured ? 'inline-block' : 'none';
}

$('#btn-gmail-sync').addEventListener('click', () => syncGmail());

async function syncGmail() {
  try {
    toast('Sincronizzazione in corso...');
    const r = await api('/api/gmail/sync', { method: 'POST', body: {} });
    toast(`Sync: ${r.parsed} importate, ${r.skipped} ignorate, ${r.errors.length} errori`);
    loadBookings();
    loadDashboard();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function handleGmailCallbackParam() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('gmail_connected') === '1') {
    toast('Gmail collegato: ' + (p.get('email') || 'OK'));
    history.replaceState({}, '', window.location.pathname);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
