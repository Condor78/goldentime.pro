import { workflow, node, trigger, expr, newCredential } from '@n8n/workflow-sdk';

const ricerca = trigger({
  type: 'n8n-nodes-base.formTrigger',
  version: 2.6,
  config: {
    name: 'Ricerca Lead',
    position: [200, 300],
    parameters: {
      formTitle: 'Vortex8 - Aziende senza sito web',
      formDescription: 'Scegli Regione, Comune e Categoria: ricevi su Google Sheet le aziende locali senza sito web.',
      formFields: { values: [
        { fieldName: 'Regione', fieldLabel: 'Regione', fieldType: 'dropdown', requiredField: true, fieldOptions: { values: [ { option: 'Abruzzo' }, { option: 'Basilicata' }, { option: 'Calabria' }, { option: 'Campania' }, { option: 'Emilia-Romagna' }, { option: 'Friuli Venezia Giulia' }, { option: 'Lazio' }, { option: 'Liguria' }, { option: 'Lombardia' }, { option: 'Marche' }, { option: 'Molise' }, { option: 'Piemonte' }, { option: 'Puglia' }, { option: 'Sardegna' }, { option: 'Sicilia' }, { option: 'Toscana' }, { option: 'Trentino-Alto Adige' }, { option: 'Umbria' }, { option: 'Valle d Aosta' }, { option: 'Veneto' } ] } },
        { fieldName: 'Comune', fieldLabel: 'Comune', fieldType: 'text', requiredField: true, placeholder: 'es. Conegliano' },
        { fieldName: 'Categoria', fieldLabel: 'Categoria', fieldType: 'dropdown', requiredField: true, fieldOptions: { values: [ { option: 'Elettricisti' }, { option: 'Idraulici' }, { option: 'Parrucchieri' }, { option: 'Fabbri' }, { option: 'Imbianchini' }, { option: 'Falegnami' }, { option: 'Giardinieri' }, { option: 'Fotografi' }, { option: 'Estetiste' }, { option: 'Autofficine' }, { option: 'Fioristi' }, { option: 'Panetterie' }, { option: 'Gommisti' }, { option: 'Serramentisti' }, { option: 'Tappezzieri' } ] } }
      ] },
      responseMode: 'onReceived',
      options: { buttonLabel: 'Cerca', path: 'lead-senza-sito', appendAttribution: false, ignoreBots: true }
    }
  },
  output: [{ Regione: 'Veneto', Comune: 'Conegliano', Categoria: 'Elettricisti' }]
});

const valida = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Valida e costruisci URL',
    position: [410, 300],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
function slug(s){
  s = (s || '').toString().trim().toLowerCase();
  let r = '';
  for (let i = 0; i < s.length; i++){
    const ch = s[i]; const c = s.charCodeAt(i);
    if ((c >= 97 && c <= 122) || (c >= 48 && c <= 57)) r += ch;
    else if (ch === ' ' || ch === '-' || ch === '_' ) r += '_';
  }
  while (r.indexOf('__') !== -1) r = r.replace('__', '_');
  return r.replace(/^_+|_+$/g, '');
}
const f = $input.first().json;
const regione = (f.Regione || '').toString().trim();
const comune = (f.Comune || '').toString().trim();
const categoria = (f.Categoria || '').toString().trim();
if (!regione || !comune || !categoria || categoria.toLowerCase() === 'tutti') { return []; }
const url = 'https://www.paginegialle.it/' + slug(regione) + '/' + slug(comune) + '/' + slug(categoria) + '.html';
return [{ json: { regione: regione, comune: comune, categoria: categoria, url: url } }];
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
    position: [620, 300],
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
    name: 'Estrai aziende',
    position: [830, 300],
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
const meta = $('Valida e costruisci URL').first().json;
const html = ($input.first().json.html) || ($input.first().json.data) || '';
if (html.length < 5000 || html.indexOf('JavaScript is disabled') !== -1) {
  throw new Error('PagineGialle ha risposto con un challenge anti-bot (AWS WAF). Riprova tra qualche minuto: la fonte blocca richieste ravvicinate dallo stesso IP.');
}
const blocks = extractLdJsonBlocks(html);
let itemList = null;
for (const b of blocks) { let parsed = null; try { parsed = JSON.parse(b.trim()); } catch (e) { parsed = null; } if (parsed) { const fl = findItemList(parsed); if (fl) { itemList = fl; break; } } }
const elements = (itemList && (itemList.itemListElement || [])) || [];
const out = [];
for (const el of elements) {
  const it = (el && el.item) || el || {};
  const addr = it.address || {};
  let tel = '';
  if (Array.isArray(it.contactPoint) && it.contactPoint[0]) tel = it.contactPoint[0].telephone || '';
  else if (it.telephone) tel = it.telephone;
  const name = it.name || '';
  if (!name) continue;
  const street = addr.streetAddress || '';
  const locality = addr.addressLocality || '';
  out.push({ json: {
    regione: meta.regione, comune: meta.comune, categoria: meta.categoria,
    pg_name: name, pg_url: it.url || '', pg_street: street, pg_cap: addr.postalCode || '',
    pg_locality: locality, pg_phone: tel,
    serperQuery: (name + ' ' + street + ' ' + locality).replace(/\\s+/g, ' ').trim()
  }});
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
    position: [1040, 300],
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
    position: [1250, 300],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
function digitsOnly(s){ s = s || ''; let r = ''; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); if (c >= 48 && c <= 57) r += s[i]; } return r; }
function normPhone(s){ let d = digitsOnly(s); if (d.length > 10 && d.slice(0,2) === '39') d = d.slice(2); return d; }
function tokens(s){ s = (s || '').toLowerCase(); let r = ''; for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); if ((c >= 97 && c <= 122) || (c >= 48 && c <= 57)) r += s[i]; else r += ' '; } return r.split(' ').filter(function(t){ return t.length > 0; }); }
function isNum(t){ for (let i = 0; i < t.length; i++){ const c = t.charCodeAt(i); if (c < 48 || c > 57) return false; } return t.length > 0; }
const STREET_STOP = { via:1, viale:1, corso:1, piazza:1, piazzale:1, vicolo:1, strada:1, stradale:1, largo:1, contrada:1, localita:1, loc:1, borgo:1, salita:1, calle:1 };
const NAME_STOP = { impianti:1, impianto:1, elettrici:1, elettrico:1, elettrica:1, idraulica:1, idraulico:1, idraulici:1, termoidraulica:1, termoidraulico:1, parrucchiere:1, parrucchieri:1, parrucchiera:1, snc:1, srl:1, srls:1, sas:1, spa:1, and:1, del:1, della:1, delle:1, dei:1, service:1, group:1, casa:1, clima:1, hair:1, salon:1, salone:1 };
function localityMatch(pgLoc, addr){ const lt = tokens(pgLoc); const at = tokens(addr); if (!lt.length) return false; return at.indexOf(lt[lt.length - 1]) !== -1; }
function capMatch(pgCap, addr){ const cap = digitsOnly(pgCap); if (cap.length < 4) return false; return tokens(addr).indexOf(cap) !== -1; }
function streetMatch(pgStreet, addr){ const pt = tokens(pgStreet); const at = tokens(addr); const nums = pt.filter(isNum); const words = pt.filter(function(t){ return t.length >= 4 && !isNum(t) && !STREET_STOP[t]; }); const numOk = nums.length ? nums.some(function(n){ return at.indexOf(n) !== -1; }) : false; const wordOk = words.some(function(w){ return at.indexOf(w) !== -1; }); return numOk && wordOk; }
function nameOverlap(pgName, title){ const a = tokens(pgName).filter(function(t){ return t.length >= 4 && !NAME_STOP[t]; }); const b = tokens(title); if (!a.length) return 0; let hit = 0; for (const t of a){ if (b.indexOf(t) !== -1) hit++; } return hit / a.length; }

const today = new Date().toISOString().slice(0, 10);
const companies = $('Estrai aziende').all();
const responses = $input.all();
const out = [];
for (let i = 0; i < companies.length; i++) {
  const c = companies[i].json;
  const rj = (responses[i] && responses[i].json) || {};
  const places = Array.isArray(rj.places) ? rj.places : [];
  const pgPhone = normPhone(c.pg_phone);

  let best = null; let level = 'NESSUNO';
  for (const p of places) { if (pgPhone && normPhone(p.phoneNumber) === pgPhone && pgPhone.length >= 6) { best = p; level = 'CERTO'; break; } }
  if (!best) { for (const p of places) { const a = p.address || ''; if (streetMatch(c.pg_street, a) && (localityMatch(c.pg_locality, a) || capMatch(c.pg_cap, a))) { best = p; level = 'CERTO'; break; } } }
  if (!best) { for (const p of places) { if (streetMatch(c.pg_street, p.address || '') && nameOverlap(c.pg_name, p.title || '') >= 0.5) { best = p; level = 'CERTO'; break; } } }
  if (!best) { for (const p of places) { const a = p.address || ''; if (nameOverlap(c.pg_name, p.title || '') >= 0.5 && (localityMatch(c.pg_locality, a) || capMatch(c.pg_cap, a))) { best = p; level = 'PROBABILE'; break; } } }

  const website = best ? (best.website || '') : '';
  let stato = '';
  if (places.length === 0) stato = 'NON_SU_MAPS';
  else if (level === 'CERTO') stato = website ? 'SITO_PRESENTE' : 'SENZA_SITO_CONFERMATO';
  else stato = 'DA_VERIFICARE';

  if (stato === 'SITO_PRESENTE') continue;

  const indirizzo = [c.pg_street, [c.pg_cap, c.pg_locality].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  out.push({ json: {
    data_ricerca: today,
    regione: c.regione, comune: c.comune, categoria: c.categoria,
    ragione_sociale: c.pg_name,
    indirizzo: indirizzo,
    telefono: c.pg_phone,
    sito_web: website,
    stato_maps: stato,
    note_pg: c.pg_url
  }});
}
return out;
`
    }
  },
  output: [{ data_ricerca: '2026-09-11', ragione_sociale: 'Star Tec', telefono: '+39 335 259130', stato_maps: 'SENZA_SITO_CONFERMATO' }]
});

const sheet = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Scrivi su Google Sheet',
    position: [1460, 300],
    parameters: {
      resource: 'sheet',
      operation: 'appendOrUpdate',
      authentication: 'serviceAccount',
      documentId: { __rl: true, mode: 'id', value: '1TQmqMnYg5uyItxLDSFKUCKuseWBPTXxUINxkBFwURis' },
      sheetName: { __rl: true, mode: 'list', value: '200566477', cachedResultName: 'Untitled' },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['Telefono'],
        value: {
          'Data ricerca': expr('{{ $json.data_ricerca }}'),
          'Regione': expr('{{ $json.regione }}'),
          'Comune': expr('{{ $json.comune }}'),
          'Categoria': expr('{{ $json.categoria }}'),
          'Ragione sociale': expr('{{ $json.ragione_sociale }}'),
          'Indirizzo': expr('{{ $json.indirizzo }}'),
          'Telefono': expr('{{ $json.telefono }}'),
          'Sito web': expr('{{ $json.sito_web }}'),
          'Stato Google Maps': expr('{{ $json.stato_maps }}'),
          'Note (URL PagineGialle)': expr('{{ $json.note_pg }}')
        },
        schema: [
          { id: 'Data ricerca', displayName: 'Data ricerca', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Regione', displayName: 'Regione', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Comune', displayName: 'Comune', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Categoria', displayName: 'Categoria', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Ragione sociale', displayName: 'Ragione sociale', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Indirizzo', displayName: 'Indirizzo', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Telefono', displayName: 'Telefono', required: false, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Sito web', displayName: 'Sito web', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Stato Google Maps', displayName: 'Stato Google Maps', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'Note (URL PagineGialle)', displayName: 'Note (URL PagineGialle)', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ]
      },
      options: { cellFormat: 'RAW' }
    },
    credentials: { googleApi: newCredential('Google Service Account account 2') }
  },
  output: [{ 'Ragione sociale': 'Star Tec' }]
});

export default workflow('leadgen-prod-v2', 'Lead Gen - Aziende senza sito web (v2)')
  .add(ricerca)
  .to(valida)
  .to(scaricaPg)
  .to(estrai)
  .to(serper)
  .to(classifica)
  .to(sheet);
