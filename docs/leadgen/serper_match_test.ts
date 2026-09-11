import { workflow, node, trigger, expr, newCredential } from '@n8n/workflow-sdk';

const avvia = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Avvia', position: [220, 300] },
  output: [{}]
});

const generaUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Genera URL',
    position: [430, 300],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const combos = [
  { regione: 'Veneto', comune: 'Conegliano', comune_slug: 'conegliano', regione_slug: 'veneto', categoria: 'Elettricisti', categoria_slug: 'elettricisti' },
  { regione: 'Veneto', comune: 'Conegliano', comune_slug: 'conegliano', regione_slug: 'veneto', categoria: 'Idraulici', categoria_slug: 'idraulici' },
  { regione: 'Veneto', comune: 'Conegliano', comune_slug: 'conegliano', regione_slug: 'veneto', categoria: 'Parrucchieri', categoria_slug: 'parrucchieri' },
  { regione: 'Sicilia', comune: 'Catania', comune_slug: 'catania', regione_slug: 'sicilia', categoria: 'Elettricisti', categoria_slug: 'elettricisti' },
  { regione: 'Sicilia', comune: 'Catania', comune_slug: 'catania', regione_slug: 'sicilia', categoria: 'Idraulici', categoria_slug: 'idraulici' }
];
return combos.map(function(c){
  return { json: { regione: c.regione, comune: c.comune, categoria: c.categoria,
    url: 'https://www.paginegialle.it/' + c.regione_slug + '/' + c.comune_slug + '/' + c.categoria_slug + '.html' } };
});
`
    }
  },
  output: [{ regione: 'Veneto', comune: 'Conegliano', categoria: 'Elettricisti', url: 'https://www.paginegialle.it/veneto/conegliano/elettricisti.html' }]
});

const scaricaPg = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Scarica PagineGialle',
    position: [640, 300],
    parameters: {
      method: 'GET',
      url: expr('{{ $json.url }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [
        { name: 'User-Agent', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
        { name: 'Accept', value: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        { name: 'Accept-Language', value: 'it-IT,it;q=0.9,en;q=0.8' }
      ] },
      options: {
        batching: { batch: { batchSize: 1, batchInterval: 2000 } },
        response: { response: { responseFormat: 'text', outputPropertyName: 'html', neverError: true } },
        timeout: 30000
      }
    }
  },
  output: [{ html: '<!DOCTYPE html>...' }]
});

const estrai = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Estrai e Campiona',
    position: [850, 300],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
function extractLdJsonBlocks(html){
  const blocks = []; const lower = html.toLowerCase(); let from = 0;
  while (true) {
    const idx = lower.indexOf('application/ld+json', from); if (idx === -1) break;
    const gt = html.indexOf('>', idx); if (gt === -1) break;
    const end = lower.indexOf('</script>', gt); if (end === -1) break;
    blocks.push(html.slice(gt + 1, end)); from = end + 9;
  }
  return blocks;
}
function findItemList(nodeObj){
  if (!nodeObj || typeof nodeObj !== 'object') return null;
  if (Array.isArray(nodeObj)) { for (const n of nodeObj) { const r = findItemList(n); if (r) return r; } return null; }
  const t = nodeObj['@type'];
  const isItemList = t === 'ItemList' || (Array.isArray(t) && t.indexOf('ItemList') !== -1);
  if (isItemList && nodeObj.itemListElement) return nodeObj;
  if (nodeObj['@graph']) { const r = findItemList(nodeObj['@graph']); if (r) return r; }
  if (nodeObj.itemListElement) return nodeObj;
  return null;
}
const PER_PAGE = 10;
const metas = $('Genera URL').all();
const pages = $input.all();
const out = [];
for (let i = 0; i < pages.length; i++) {
  const meta = (metas[i] && metas[i].json) || {};
  const pj = (pages[i] && pages[i].json) || {};
  const html = pj.html || pj.data || pj.body || '';
  const wafBlocked = html.length < 5000 || html.indexOf('JavaScript is disabled') !== -1;
  if (wafBlocked) continue;
  const blocks = extractLdJsonBlocks(html);
  let itemList = null;
  for (const b of blocks) { let parsed = null; try { parsed = JSON.parse(b.trim()); } catch (e) { parsed = null; } if (parsed) { const fl = findItemList(parsed); if (fl) { itemList = fl; break; } } }
  const elements = (itemList && (itemList.itemListElement || [])) || [];
  let taken = 0;
  for (const el of elements) {
    if (taken >= PER_PAGE) break;
    const it = (el && el.item) || el || {};
    const addr = it.address || {};
    let tel = '';
    if (Array.isArray(it.contactPoint) && it.contactPoint[0]) tel = it.contactPoint[0].telephone || '';
    else if (it.telephone) tel = it.telephone;
    const name = it.name || '';
    const street = addr.streetAddress || '';
    const locality = addr.addressLocality || '';
    if (!name) continue;
    taken++;
    out.push({ json: {
      regione: meta.regione || '', comune_cercato: meta.comune || '', categoria: meta.categoria || '',
      pg_name: name, pg_url: it.url || '', pg_street: street, pg_cap: addr.postalCode || '',
      pg_locality: locality, pg_region: addr.addressRegion || '', pg_phone: tel,
      serperQuery: (name + ' ' + street + ' ' + locality).replace(/\\s+/g, ' ').trim()
    }});
  }
}
return out;
`
    }
  },
  output: [{ pg_name: 'Star Tec', pg_phone: '+39 335 259130', serperQuery: 'Star Tec Via Cal dell Oca 24 Conegliano' }]
});

const serper = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Serper Places',
    position: [1060, 300],
    parameters: {
      method: 'POST',
      url: 'https://google.serper.dev/places',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ q: $json.serperQuery, gl: "it", hl: "it" }) }}'),
      options: {
        batching: { batch: { batchSize: 1, batchInterval: 1100 } },
        response: { response: { neverError: true } },
        timeout: 20000
      }
    },
    credentials: { httpHeaderAuth: newCredential('Serper.dev API') }
  },
  output: [{ places: [{ title: 'Star Tec', address: 'Via Cal dell Oca, Conegliano', phoneNumber: '+39 335 259130' }] }]
});

const classifica = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Match e Classifica',
    position: [1270, 300],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
function digitsOnly(s){ s = s || ''; let r = ''; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); if (c >= 48 && c <= 57) r += s[i]; } return r; }
function normPhone(s){ let d = digitsOnly(s); if (d.length > 10 && d.slice(0,2) === '39') d = d.slice(2); return d; }
function tokens(s){ s = (s || '').toLowerCase(); let r = ''; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); if ((c >= 97 && c <= 122) || (c >= 48 && c <= 57)) r += s[i]; else r += ' '; } return r.split(' ').filter(function(t){ return t.length > 0; }); }
function isNum(t){ for (let i = 0; i < t.length; i++){ const c = t.charCodeAt(i); if (c < 48 || c > 57) return false; } return t.length > 0; }
const STREET_STOP = { via:1, viale:1, corso:1, piazza:1, piazzale:1, vicolo:1, strada:1, stradale:1, largo:1, contrada:1, localita:1, loc:1, borgo:1, salita:1 };
const NAME_STOP = { impianti:1, impianto:1, elettrici:1, elettrico:1, elettrica:1, idraulica:1, idraulico:1, idraulici:1, termoidraulica:1, termoidraulico:1, parrucchiere:1, parrucchieri:1, parrucchiera:1, snc:1, srl:1, srls:1, sas:1, spa:1, and:1, del:1, della:1, delle:1, dei:1, service:1, group:1, casa:1, clima:1 };

function localityMatch(pgLoc, addr){
  const lt = tokens(pgLoc); const at = tokens(addr); if (!lt.length) return false;
  const main = lt[lt.length - 1];
  return at.indexOf(main) !== -1;
}
function streetMatch(pgStreet, addr){
  const pt = tokens(pgStreet); const at = tokens(addr);
  const nums = pt.filter(isNum);
  const words = pt.filter(function(t){ return t.length >= 4 && !isNum(t) && !STREET_STOP[t]; });
  const numOk = nums.length ? nums.some(function(n){ return at.indexOf(n) !== -1; }) : false;
  const wordOk = words.some(function(w){ return at.indexOf(w) !== -1; });
  return numOk && wordOk;
}
function nameOverlap(pgName, title){
  const a = tokens(pgName).filter(function(t){ return t.length >= 4 && !NAME_STOP[t]; });
  const b = tokens(title);
  if (!a.length) return 0;
  let hit = 0; for (const t of a){ if (b.indexOf(t) !== -1) hit++; }
  return hit / a.length;
}

const companies = $('Estrai e Campiona').all();
const responses = $input.all();
const out = [];
for (let i = 0; i < companies.length; i++) {
  const c = companies[i].json;
  const rj = (responses[i] && responses[i].json) || {};
  const places = Array.isArray(rj.places) ? rj.places : [];
  const pgPhone = normPhone(c.pg_phone);

  let best = null; let level = 'NESSUNO'; let reason = '';
  // 1) phone exact => CERTO
  for (const p of places) {
    if (pgPhone && normPhone(p.phoneNumber) === pgPhone && pgPhone.length >= 6) { best = p; level = 'CERTO'; reason = 'telefono'; break; }
  }
  // 2) street + locality => CERTO
  if (!best) {
    for (const p of places) {
      if (streetMatch(c.pg_street, p.address || '') && localityMatch(c.pg_locality, p.address || '')) { best = p; level = 'CERTO'; reason = 'via+comune'; break; }
    }
  }
  // 3) name overlap + locality => PROBABILE
  if (!best) {
    for (const p of places) {
      if (nameOverlap(c.pg_name, p.title || '') >= 0.5 && localityMatch(c.pg_locality, p.address || '')) { best = p; level = 'PROBABILE'; reason = 'nome+comune'; break; }
    }
  }

  let stato = '';
  const website = best ? (best.website || '') : '';
  if (places.length === 0) stato = 'NON_SU_MAPS';
  else if (level === 'CERTO') stato = website ? 'SITO_PRESENTE' : 'SENZA_SITO_CONFERMATO';
  else stato = 'DA_VERIFICARE';

  out.push({ json: {
    regione: c.regione, comune_cercato: c.comune_cercato, categoria: c.categoria,
    pg_name: c.pg_name, pg_street: c.pg_street, pg_cap: c.pg_cap, pg_locality: c.pg_locality, pg_phone: c.pg_phone,
    telefono_norm: pgPhone,
    places_count: places.length,
    serper_title: best ? (best.title || '') : (places[0] ? places[0].title : ''),
    serper_address: best ? (best.address || '') : (places[0] ? places[0].address : ''),
    serper_phone: best ? (best.phoneNumber || '') : (places[0] ? places[0].phoneNumber : ''),
    serper_website: website,
    match_level: level, match_reason: reason,
    stato: stato,
    pg_url: c.pg_url
  }});
}
return out;
`
    }
  },
  output: [{ pg_name: 'Star Tec', stato: 'SENZA_SITO_CONFERMATO', match_level: 'CERTO' }]
});

export default workflow('leadgen-serper-match', 'TEST - Lead Gen Serper + Match')
  .add(avvia)
  .to(generaUrl)
  .to(scaricaPg)
  .to(estrai)
  .to(serper)
  .to(classifica);
