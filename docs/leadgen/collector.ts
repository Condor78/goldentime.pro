import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const avvia = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Avvia', position: [240, 300] },
  output: [{}]
});

const generaUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Genera URL',
    position: [460, 300],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
const combos = [
  { regione: 'Veneto', regione_slug: 'veneto', comune: 'Conegliano', comune_slug: 'conegliano', categoria: 'Elettricisti', categoria_slug: 'elettricisti' },
  { regione: 'Veneto', regione_slug: 'veneto', comune: 'Conegliano', comune_slug: 'conegliano', categoria: 'Idraulici', categoria_slug: 'idraulici' },
  { regione: 'Veneto', regione_slug: 'veneto', comune: 'Conegliano', comune_slug: 'conegliano', categoria: 'Parrucchieri', categoria_slug: 'parrucchieri' },
  { regione: 'Sicilia', regione_slug: 'sicilia', comune: 'Catania', comune_slug: 'catania', categoria: 'Elettricisti', categoria_slug: 'elettricisti' },
  { regione: 'Sicilia', regione_slug: 'sicilia', comune: 'Catania', comune_slug: 'catania', categoria: 'Idraulici', categoria_slug: 'idraulici' },
  { regione: 'Sicilia', regione_slug: 'sicilia', comune: 'Catania', comune_slug: 'catania', categoria: 'Parrucchieri', categoria_slug: 'parrucchieri' }
];
return combos.map(function(c){
  return { json: {
    regione: c.regione,
    comune: c.comune,
    categoria: c.categoria,
    url: 'https://www.paginegialle.it/' + c.regione_slug + '/' + c.comune_slug + '/' + c.categoria_slug + '.html'
  }};
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
    position: [680, 300],
    parameters: {
      method: 'GET',
      url: expr('{{ $json.url }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'User-Agent', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
          { name: 'Accept', value: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
          { name: 'Accept-Language', value: 'it-IT,it;q=0.9,en;q=0.8' }
        ]
      },
      options: {
        batching: { batch: { batchSize: 1, batchInterval: 1500 } },
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
    name: 'Estrai JSON-LD',
    position: [900, 300],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `
function extractLdJsonBlocks(html){
  const blocks = [];
  const lower = html.toLowerCase();
  let from = 0;
  while (true) {
    const idx = lower.indexOf('application/ld+json', from);
    if (idx === -1) break;
    const gt = html.indexOf('>', idx);
    if (gt === -1) break;
    const end = lower.indexOf('</script>', gt);
    if (end === -1) break;
    blocks.push(html.slice(gt + 1, end));
    from = end + 9;
  }
  return blocks;
}
function findItemList(nodeObj){
  if (!nodeObj || typeof nodeObj !== 'object') return null;
  if (Array.isArray(nodeObj)) {
    for (const n of nodeObj) { const r = findItemList(n); if (r) return r; }
    return null;
  }
  const t = nodeObj['@type'];
  const isItemList = t === 'ItemList' || (Array.isArray(t) && t.indexOf('ItemList') !== -1);
  if (isItemList && nodeObj.itemListElement) return nodeObj;
  if (nodeObj['@graph']) { const r = findItemList(nodeObj['@graph']); if (r) return r; }
  if (nodeObj.itemListElement) return nodeObj;
  return null;
}
function tagText(html, tag){
  const lower = html.toLowerCase();
  const s = lower.indexOf('<' + tag);
  if (s === -1) return '';
  const gt = html.indexOf('>', s);
  if (gt === -1) return '';
  const e = lower.indexOf('</' + tag + '>', gt);
  if (e === -1) return '';
  return html.slice(gt + 1, e);
}
function clean(s){
  if (!s) return '';
  let r = '';
  let prevSpace = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '<') { const j = s.indexOf('>', i); if (j !== -1) { i = j; prevSpace = false; continue; } }
    const code = s.charCodeAt(i);
    if (code === 32 || code === 9 || code === 10 || code === 13) { if (!prevSpace) { r += ' '; prevSpace = true; } }
    else { r += ch; prevSpace = false; }
  }
  return r.trim();
}
function countOccurrences(html, needle){ return html.split(needle).length - 1; }

const metas = $('Genera URL').all();
const pages = $input.all();
const out = [];
for (let i = 0; i < pages.length; i++) {
  const meta = (metas[i] && metas[i].json) || {};
  const pj = (pages[i] && pages[i].json) || {};
  const html = pj.html || pj.data || pj.body || '';
  const blocks = extractLdJsonBlocks(html);
  let itemList = null;
  for (const b of blocks) {
    let parsed = null;
    try { parsed = JSON.parse(b.trim()); } catch (e) { parsed = null; }
    if (parsed) { const fl = findItemList(parsed); if (fl) { itemList = fl; break; } }
  }
  const elements = (itemList && (itemList.itemListElement || [])) || [];
  const companies = [];
  for (const el of elements) {
    const it = (el && el.item) || el || {};
    const addr = it.address || {};
    let tel = '';
    if (Array.isArray(it.contactPoint) && it.contactPoint[0]) tel = it.contactPoint[0].telephone || '';
    else if (it.telephone) tel = it.telephone;
    companies.push({
      name: it.name || '',
      pg_url: it.url || '',
      streetAddress: addr.streetAddress || '',
      postalCode: addr.postalCode || '',
      addressLocality: addr.addressLocality || '',
      addressRegion: addr.addressRegion || '',
      telephone: tel
    });
  }
  out.push({ json: {
    regione: meta.regione || '',
    comune: meta.comune || '',
    categoria: meta.categoria || '',
    url: meta.url || '',
    httpOk2xx: html.length > 5000,
    htmlLength: html.length,
    looksForbidden: html.indexOf('403 Forbidden') !== -1 || html.indexOf('Request unsuccessful') !== -1 || html.indexOf('Access Denied') !== -1,
    jsonLdBlocks: blocks.length,
    hasItemList: !!itemList,
    pageTitle: clean(tagText(html, 'title')),
    h1: clean(tagText(html, 'h1')),
    siteButton_sito_ig: countOccurrences(html, 'data-pag="sito_ig"'),
    siteButton_titleSitoWeb: countOccurrences(html, 'title="sito web'),
    companyCount: companies.length,
    companies: companies
  }});
}
return out;
`
    }
  },
  output: [{ regione: 'Veneto', comune: 'Conegliano', categoria: 'Elettricisti', companyCount: 30, companies: [] }]
});

export default workflow('leadgen-collector', 'TEMP - Collector Analisi Lead Gen')
  .add(avvia)
  .to(generaUrl)
  .to(scaricaPg)
  .to(estrai);
