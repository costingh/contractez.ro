// Contractez Copilot — popup: stare conexiune, contoarele zilei, pauză, link spre /admin/leads.
'use strict';

const $ = (id) => document.getElementById(id);

function send(msg) {
  return chrome.runtime.sendMessage(msg).catch((e) => ({ ok: false, error: { message: String(e.message || e) } }));
}

function renderState(s) {
  $('baseUrl').textContent = s.baseUrl;
  $('leads').href = s.baseUrl + '/admin/leads';
  $('sRead').textContent = s.stats.read || 0;
  $('sNew').textContent = s.stats.sentNew || 0;
  $('sDup').textContent = s.stats.duplicates || 0;
  $('sThreads').textContent = s.stats.threads || 0;
  $('queued').textContent = s.queued ? `În coadă spre server: ${s.queued}` : '';
  $('paused').checked = s.paused;
  const err = $('error');
  if (s.lastError) {
    err.style.display = 'block';
    err.textContent = s.lastError.message;
  } else {
    err.style.display = 'none';
  }
}

async function refresh() {
  const s = await send({ type: 'getState' });
  if (s && s.stats) renderState(s);

  if (s && !s.hasToken) {
    setConn('err', 'Lipsește tokenul — deschide Opțiuni.');
    return;
  }
  const r = await send({ type: 'testConnection' });
  if (r && r.ok) setConn(s && s.paused ? 'paused' : 'ok', s && s.paused ? 'Conectat — în pauză' : 'Conectat');
  else setConn('err', (r && r.error && r.error.message) || 'Conexiune eșuată.');
  const s2 = await send({ type: 'getState' });
  if (s2 && s2.stats) renderState(s2);
}

function setConn(kind, text) {
  $('dot').className = 'dot ' + kind;
  $('connText').textContent = text;
}

$('paused').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ paused: e.target.checked });
  refresh();
});

$('options').addEventListener('click', () => chrome.runtime.openOptionsPage());

refresh();
