// Contractez Copilot — opțiuni: URL de bază (storage.sync), token (storage.local), test conexiune, golire cache.
'use strict';

const DEFAULT_BASE_URL = 'https://contractez.ro';
const ALLOWED_ORIGINS = ['https://contractez.ro', 'http://localhost:3000']; // = host_permissions din manifest
const $ = (id) => document.getElementById(id);

function show(el, kind, text) {
  el.className = 'msg ' + kind;
  el.textContent = text;
}

function validateBaseUrl(raw) {
  const v = String(raw || '').trim().replace(/\/+$/, '') || DEFAULT_BASE_URL;
  let u;
  try {
    u = new URL(v);
  } catch (_) {
    return { error: 'URL invalid.' };
  }
  if (!ALLOWED_ORIGINS.includes(u.origin)) {
    return { error: `Origine nepermisă: ${u.origin}. Folosește ${ALLOWED_ORIGINS.join(' sau ')} (sau adaugă originea în host_permissions din manifest.json).` };
  }
  if (u.pathname !== '/' && u.pathname !== '') return { error: 'Pune doar originea, fără cale (ex. https://contractez.ro).' };
  return { value: u.origin };
}

async function load() {
  const [{ baseUrl }, { token, sentIds }] = await Promise.all([
    chrome.storage.sync.get({ baseUrl: DEFAULT_BASE_URL }),
    chrome.storage.local.get({ token: '', sentIds: [] }),
  ]);
  $('baseUrl').value = baseUrl;
  $('token').value = token;
  $('cacheInfo').textContent = `Id-uri în cache: ${Array.isArray(sentIds) ? sentIds.length : 0}`;
}

async function save() {
  const b = validateBaseUrl($('baseUrl').value);
  if (b.error) {
    show($('msg'), 'err', b.error);
    return false;
  }
  const token = $('token').value.trim();
  await Promise.all([chrome.storage.sync.set({ baseUrl: b.value }), chrome.storage.local.set({ token })]);
  $('baseUrl').value = b.value;
  show($('msg'), 'ok', token ? 'Salvat.' : 'Salvat, dar fără token extensia nu poate trimite nimic.');
  return true;
}

$('save').addEventListener('click', save);

$('test').addEventListener('click', async () => {
  const btn = $('test');
  btn.disabled = true;
  try {
    if (!(await save())) return;
    show($('msg'), 'ok', 'Testez…');
    const r = await chrome.runtime.sendMessage({ type: 'testConnection' });
    if (r && r.ok) show($('msg'), 'ok', `Conectat la ${r.baseUrl}. Tokenul este valid.`);
    else show($('msg'), 'err', (r && r.error && r.error.message) || 'Conexiune eșuată.');
  } catch (e) {
    show($('msg'), 'err', String(e.message || e));
  } finally {
    btn.disabled = false;
  }
});

$('toggleToken').addEventListener('click', () => {
  const t = $('token');
  t.type = t.type === 'password' ? 'text' : 'password';
  $('toggleToken').textContent = t.type === 'password' ? 'Arată' : 'Ascunde';
});

$('reset').addEventListener('click', async () => {
  if (!confirm('Golești cache-ul de id-uri trimise și contoarele de azi? Itemii deja trimiși vor fi retrimiși (serverul îi va ignora ca duplicate).')) return;
  await chrome.runtime.sendMessage({ type: 'resetCache' });
  show($('msgReset'), 'ok', 'Cache golit.');
  load();
});

load();
