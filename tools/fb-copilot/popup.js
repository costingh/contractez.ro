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

/** Rulează extensia pe tab-ul curent? (Chrome o pune doar în paginile încărcate după instalare.) */
async function checkTab() {
  const el = $('tabState');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = (tab && tab.url) || '';
    if (!/^https:\/\/www\.facebook\.com\//.test(url)) {
      el.textContent = 'Deschide un grup Facebook ca să înceapă citirea.';
      return;
    }
    const r = await chrome.tabs.sendMessage(tab.id, { type: 'ping' }).catch(() => null);
    if (!r) el.textContent = '⚠ Extensia nu rulează pe acest tab — apasă F5 pe pagina Facebook.';
    else if (r.active) el.textContent = `Activ pe acest grup · citite ${r.counters?.read ?? 0}, noi ${r.counters?.sentNew ?? 0}`;
    else el.textContent = /\/messages\//.test(url) ? 'Messenger: verific istoricul conversației.' : 'Rulează — intră într-un grup ca să înceapă citirea.';
  } catch {
    el.textContent = '';
  }
}

async function refresh() {
  checkTab();
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
