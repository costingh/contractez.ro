/*
 * Contractez Copilot — service worker (background.js)
 * ---------------------------------------------------------------------------
 * Singurul loc care vorbește cu serverul Contractez (docs/OUTREACH.md).
 *   - primește itemi de la content-group.js, îi strânge în loturi (max 50, debounce ~3 s);
 *   - ține minte id-urile deja trimise (LRU ~20k în chrome.storage.local) ca să nu le retrimită;
 *   - întreabă statusul itemilor vizibili (chip-uri) și raportează conversațiile Messenger;
 *   - afișează erorile 401/503 în badge și în popup.
 * Nu deschide pagini, nu injectează scripturi, nu rulează nimic pe Facebook singur.
 */
'use strict';

const DEFAULT_BASE_URL = 'https://contractez.ro';
const BATCH_MAX = 50; // limita contractului pentru /ingest
const DEBOUNCE_MS = 3000;
const SENT_CACHE_MAX = 20000;
const QUEUE_MAX = 2000;
const STATUS_MAX_IDS = 100;
const RETRY_MIN_MS = 15000;
const RETRY_MAX_MS = 5 * 60 * 1000;

/** Doar aceste pagini au voie să trimită date (pe lângă popup/opțiuni). */
const GROUP_PAGE = /^https:\/\/www\.facebook\.com\/groups\//;
const THREAD_PAGE = /^https:\/\/www\.facebook\.com\/messages\/(?:e2ee\/)?t\//;
/** Originile pentru care avem host_permissions (altfel fetch-ul e blocat de CORS). */
const ALLOWED_ORIGINS = ['https://contractez.ro', 'http://localhost:3000'];

/* -------------------------------------------------------------------------- */
/* Config & stare                                                              */
/* -------------------------------------------------------------------------- */

async function getConfig() {
  const [{ baseUrl }, { token, paused }] = await Promise.all([
    chrome.storage.sync.get({ baseUrl: DEFAULT_BASE_URL }),
    // Tokenul stă în storage.local (nu se sincronizează în contul Google).
    chrome.storage.local.get({ token: '', paused: false }),
  ]);
  return { baseUrl: normalizeBaseUrl(baseUrl), token: (token || '').trim(), paused: Boolean(paused) };
}

function normalizeBaseUrl(u) {
  return String(u || DEFAULT_BASE_URL).trim().replace(/\/+$/, '') || DEFAULT_BASE_URL;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Contoarele zilei curente (resetate automat la schimbarea datei). Serializate ca să nu pierdem incrementări. */
let statsChain = Promise.resolve();
function bumpStats(delta) {
  statsChain = statsChain.then(() => bumpStatsNow(delta)).catch((e) => console.warn('[Contractez] stats', e));
  return statsChain;
}

async function bumpStatsNow(delta) {
  const { stats } = await chrome.storage.local.get({ stats: null });
  const today = todayKey();
  const s = stats && stats.date === today ? stats : { date: today, read: 0, sentNew: 0, duplicates: 0, threads: 0, errors: 0 };
  for (const [k, v] of Object.entries(delta)) s[k] = (s[k] || 0) + v;
  await chrome.storage.local.set({ stats: s });
  await refreshBadge();
  return s;
}

async function setLastError(err) {
  await chrome.storage.local.set({ lastError: err ? { ...err, at: Date.now() } : null });
  await refreshBadge();
}

async function refreshBadge() {
  const { lastError, paused, stats } = await chrome.storage.local.get({ lastError: null, paused: false, stats: null });
  if (paused) {
    await chrome.action.setBadgeText({ text: 'II' });
    await chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
    await chrome.action.setTitle({ title: 'Contractez Copilot — în pauză' });
  } else if (lastError) {
    await chrome.action.setBadgeText({ text: lastError.status === 401 ? '401' : lastError.status === 503 ? '503' : '!' });
    await chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
    await chrome.action.setTitle({ title: 'Contractez Copilot — ' + lastError.message });
  } else {
    const n = stats && stats.date === todayKey() ? stats.sentNew : 0;
    await chrome.action.setBadgeText({ text: n ? String(n > 999 ? '999+' : n) : '' });
    await chrome.action.setBadgeBackgroundColor({ color: '#2b4acb' });
    await chrome.action.setTitle({ title: 'Contractez Copilot' });
  }
}

/* -------------------------------------------------------------------------- */
/* LRU cu id-urile deja trimise                                                */
/* -------------------------------------------------------------------------- */

/** Map păstrează ordinea inserării: primul element = cel mai vechi folosit. */
let sentCache = null;
let sentCacheLoading = null;
let sentCacheDirty = false;
let sentCacheTimer = null;

function loadSentCache() {
  if (sentCache) return Promise.resolve(sentCache);
  // Promisiune memorată: apelurile concurente nu trebuie să suprascrie Map-ul unul altuia.
  sentCacheLoading =
    sentCacheLoading ||
    chrome.storage.local.get({ sentIds: [] }).then(({ sentIds }) => {
      sentCache = sentCache || new Map((Array.isArray(sentIds) ? sentIds : []).map((id) => [id, 1]));
      return sentCache;
    });
  return sentCacheLoading;
}

function touchSent(id) {
  sentCache.delete(id);
  sentCache.set(id, 1);
  while (sentCache.size > SENT_CACHE_MAX) sentCache.delete(sentCache.keys().next().value);
  sentCacheDirty = true;
  if (!sentCacheTimer) {
    sentCacheTimer = setTimeout(persistSentCache, 2000);
  }
}

async function persistSentCache() {
  sentCacheTimer = null;
  if (!sentCacheDirty || !sentCache) return;
  sentCacheDirty = false;
  await chrome.storage.local.set({ sentIds: Array.from(sentCache.keys()) });
}

async function resetCache() {
  sentCache = new Map();
  sentCacheDirty = false;
  queue = [];
  await chrome.storage.local.set({ sentIds: [], stats: null, lastError: null });
  await chrome.storage.session.set({ queue: [] });
  await refreshBadge();
}

/* -------------------------------------------------------------------------- */
/* Coada de ingestie                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Coada: [{ groupId, groupName, item, tabId }]. Persistată în storage.session ca să
 * supraviețuiască opririi service worker-ului (Chrome îl oprește după ~30 s de inactivitate).
 */
let queue = null;
let queueLoading = null;
let flushTimer = null;
let flushing = false;
let retryDelay = RETRY_MIN_MS;
let blockedByAuth = false;

function loadQueue() {
  if (queue) return Promise.resolve(queue);
  queueLoading =
    queueLoading ||
    chrome.storage.session.get({ queue: [] }).then(({ queue: q }) => {
      queue = queue || (Array.isArray(q) ? q : []);
      return queue;
    });
  return queueLoading;
}

async function saveQueue() {
  await chrome.storage.session.set({ queue });
}

function scheduleFlush(ms = DEBOUNCE_MS) {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush().catch((e) => console.warn('[Contractez] flush', e));
  }, ms);
}

async function enqueue({ groupId, groupName, items }, tabId) {
  await Promise.all([loadQueue(), loadSentCache()]);
  const queued = new Set(queue.map((q) => q.item.fbItemId));
  const cached = [];
  let added = 0;
  for (const item of items) {
    if (!item || typeof item.fbItemId !== 'string') continue;
    if (sentCache.has(item.fbItemId)) {
      cached.push(item.fbItemId);
      continue;
    }
    if (queued.has(item.fbItemId)) continue;
    if (queue.length >= QUEUE_MAX) break;
    queue.push({ groupId, groupName: groupName || null, item, tabId });
    queued.add(item.fbItemId);
    added++;
  }
  await saveQueue();
  await bumpStats({ read: items.length, duplicates: cached.length });
  if (added) scheduleFlush(queue.length >= BATCH_MAX ? 0 : DEBOUNCE_MS);
  return { queued: added, cached };
}

/** Trimite coada în loturi de max 50, câte un grup pe lot (contractul are un singur groupId). */
async function flush() {
  if (flushing) return;
  flushing = true;
  try {
    await Promise.all([loadQueue(), loadSentCache()]);
    while (queue.length) {
      const cfg = await getConfig();
      if (cfg.paused) return; // reluăm la scoaterea din pauză
      if (!cfg.token) {
        await setLastError({ status: 401, message: 'Lipsește tokenul — completează-l în Opțiuni.' });
        blockedByAuth = true;
        return;
      }
      const groupId = queue[0].groupId;
      const batch = queue.filter((q) => q.groupId === groupId).slice(0, BATCH_MAX);
      const body = {
        groupId,
        groupName: batch.find((b) => b.groupName)?.groupName || null,
        items: batch.map((b) => b.item),
      };
      const res = await api(cfg, 'POST', '/api/outreach/ingest', body);
      if (!res.ok) {
        if (res.status === 401) {
          blockedByAuth = true; // așteptăm un token nou (storage.onChanged)
          notifyTabs(batch, { type: 'apiError', error: res.error });
          return;
        }
        if (res.status === 503 || res.status === 0 || res.status === 429 || res.status >= 500) {
          notifyTabs(batch, { type: 'apiError', error: res.error });
          scheduleFlush(retryDelay);
          retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
          return;
        }
        // 400/413/…: lotul e invalid; îl aruncăm ca să nu blocheze coada.
        removeFromQueue(batch);
        await saveQueue();
        notifyTabs(batch, { type: 'apiError', error: res.error });
        await bumpStats({ errors: 1 });
        continue;
      }
      retryDelay = RETRY_MIN_MS;
      blockedByAuth = false;
      removeFromQueue(batch);
      for (const b of batch) touchSent(b.item.fbItemId);
      await saveQueue();
      const data = res.data || {};
      await bumpStats({ sentNew: Number(data.accepted) || 0, duplicates: Number(data.duplicates) || 0 });
      await setLastError(null);
      notifyTabs(batch, {
        type: 'ingestResult',
        accepted: Number(data.accepted) || 0,
        duplicates: Number(data.duplicates) || 0,
        leads: Array.isArray(data.leads) ? data.leads : [],
      });
    }
  } finally {
    flushing = false;
  }
}

function removeFromQueue(batch) {
  const ids = new Set(batch.map((b) => b.item.fbItemId));
  queue = queue.filter((q) => !ids.has(q.item.fbItemId));
}

/** Rezultatul ajunge doar la tab-urile care au trimis itemii respectivi. */
function notifyTabs(batch, msg) {
  const byTab = new Map();
  for (const b of batch) {
    if (typeof b.tabId !== 'number') continue;
    if (!byTab.has(b.tabId)) byTab.set(b.tabId, new Set());
    byTab.get(b.tabId).add(b.item.fbItemId);
  }
  for (const [tabId, ids] of byTab) {
    const payload = { ...msg, ids: Array.from(ids) };
    if (msg.leads) payload.leads = msg.leads.filter((l) => ids.has(l.fbItemId));
    if (msg.type === 'ingestResult') {
      // „accepted/duplicates” sunt la nivel de lot; le împărțim proporțional doar dacă lotul are un singur tab.
      if (byTab.size > 1) {
        payload.accepted = payload.leads.filter((l) => l.status === 'new').length;
        payload.duplicates = ids.size - payload.accepted;
      }
    }
    chrome.tabs.sendMessage(tabId, payload).catch(() => {});
  }
}

/* -------------------------------------------------------------------------- */
/* API                                                                         */
/* -------------------------------------------------------------------------- */

const ERR_TEXT = {
  0: 'Serverul nu răspunde (verifică URL-ul și conexiunea).',
  401: 'Token invalid (401) — verifică tokenul în Opțiuni.',
  403: 'Acces refuzat (403).',
  404: 'Endpoint inexistent (404) — serverul nu are încă /api/outreach (verifică deploy-ul și URL-ul de bază).',
  429: 'Prea multe cereri (429) — reîncerc automat.',
  503: 'Outreach dezactivat pe server (503) — lipsește OUTREACH_TOKEN în mediul serverului.',
};

/**
 * @returns {Promise<{ok: true, status: number, data: any} | {ok: false, status: number, error: {status: number, message: string}}>}
 */
async function api(cfg, method, path, body) {
  const origin = safeOrigin(cfg.baseUrl);
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    const error = { status: 0, message: `URL de bază nepermis: ${cfg.baseUrl}. Folosește https://contractez.ro sau http://localhost:3000.` };
    await setLastError(error);
    return { ok: false, status: 0, error };
  }
  let res;
  try {
    res = await fetch(cfg.baseUrl + path, {
      method,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch (e) {
    const error = { status: 0, message: ERR_TEXT[0] };
    await setLastError(error);
    return { ok: false, status: 0, error };
  }
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* răspuns fără JSON */
  }
  if (!res.ok) {
    const serverMsg = data && (data.error || data.message);
    const error = {
      status: res.status,
      message: ERR_TEXT[res.status] || `Eroare server (${res.status})${serverMsg ? ': ' + String(serverMsg).slice(0, 160) : ''}.`,
    };
    await setLastError(error);
    if (res.status !== 401 && res.status !== 503) await bumpStats({ errors: 1 });
    return { ok: false, status: res.status, error };
  }
  return { ok: true, status: res.status, data };
}

function safeOrigin(u) {
  try {
    return new URL(u).origin;
  } catch (_) {
    return null;
  }
}

async function fetchStatus(ids) {
  const clean = Array.from(new Set((ids || []).filter((x) => typeof x === 'string' && x.length >= 3))).slice(0, STATUS_MAX_IDS);
  if (!clean.length) return { ok: true, leads: [] };
  const cfg = await getConfig();
  if (cfg.paused) return { ok: false, paused: true };
  if (!cfg.token) return { ok: false, error: { status: 401, message: 'Lipsește tokenul — completează-l în Opțiuni.' } };
  const res = await api(cfg, 'GET', '/api/outreach/status?ids=' + encodeURIComponent(clean.join(',')));
  if (!res.ok) return { ok: false, error: res.error };
  await setLastError(null);
  return { ok: true, leads: (res.data && res.data.leads) || [] };
}

async function reportThread(payload) {
  const cfg = await getConfig();
  if (cfg.paused) return { ok: false, paused: true };
  if (!cfg.token) return { ok: false, error: { status: 401, message: 'Lipsește tokenul — completează-l în Opțiuni.' } };
  const body = {
    threadUrl: payload.threadUrl || null,
    authorFbId: payload.authorFbId || null,
    authorProfileUrl: payload.authorProfileUrl || null,
    hasHistory: Boolean(payload.hasHistory),
  };
  const res = await api(cfg, 'POST', '/api/outreach/thread', body);
  if (!res.ok) return { ok: false, error: res.error };
  await setLastError(null);
  await bumpStats({ threads: 1 });
  return { ok: true, data: res.data };
}

/** Test de conexiune: un id fictiv → 200 {leads: []} dacă tokenul e bun. */
async function testConnection() {
  const cfg = await getConfig();
  if (!cfg.token) return { ok: false, error: { status: 401, message: 'Lipsește tokenul — completează-l în Opțiuni.' }, baseUrl: cfg.baseUrl };
  const res = await api(cfg, 'GET', '/api/outreach/status?ids=' + encodeURIComponent('post:0'));
  if (res.ok) {
    await setLastError(null);
    if (blockedByAuth) {
      blockedByAuth = false;
      scheduleFlush(500);
    }
  }
  return { ok: res.ok, error: res.ok ? null : res.error, baseUrl: cfg.baseUrl };
}

async function getState() {
  await loadQueue();
  const cfg = await getConfig();
  const { stats, lastError } = await chrome.storage.local.get({ stats: null, lastError: null });
  return {
    baseUrl: cfg.baseUrl,
    hasToken: Boolean(cfg.token),
    paused: cfg.paused,
    stats: stats && stats.date === todayKey() ? stats : { date: todayKey(), read: 0, sentNew: 0, duplicates: 0, threads: 0, errors: 0 },
    lastError,
    queued: queue.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Mesaje                                                                      */
/* -------------------------------------------------------------------------- */

function senderKind(sender) {
  if (sender.id !== chrome.runtime.id) return null;
  // FB e SPA: URL-ul tab-ului reflectă navigarea internă (pushState), URL-ul documentului nu întotdeauna.
  const url = (sender.tab && sender.tab.url) || sender.url || '';
  if (url.startsWith(chrome.runtime.getURL(''))) return 'extension';
  if (!sender.tab) return null;
  if (GROUP_PAGE.test(url)) return 'group';
  if (THREAD_PAGE.test(url)) return 'thread';
  return null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const kind = senderKind(sender);
  if (!kind || !msg || typeof msg.type !== 'string') return false;

  const handle = async () => {
    switch (msg.type) {
      case 'ingest': {
        if (kind !== 'group') return { ok: false, error: { status: 0, message: 'Pagină nepermisă.' } };
        const { paused } = await getConfig();
        if (paused) return { ok: false, paused: true };
        if (!msg.groupId || !Array.isArray(msg.items) || !msg.items.length) return { ok: true, queued: 0, cached: [] };
        const r = await enqueue({ groupId: String(msg.groupId), groupName: msg.groupName, items: msg.items }, sender.tab.id);
        return { ok: true, ...r };
      }
      case 'status':
        if (kind !== 'group') return { ok: false, error: { status: 0, message: 'Pagină nepermisă.' } };
        return fetchStatus(msg.ids);
      case 'thread':
        if (kind !== 'thread') return { ok: false, error: { status: 0, message: 'Pagină nepermisă.' } };
        return reportThread(msg.payload || {});
      case 'getState':
        return getState();
      case 'getConfig': {
        const cfg = await getConfig();
        return { baseUrl: cfg.baseUrl, paused: cfg.paused };
      }
      case 'testConnection':
        if (kind !== 'extension') return { ok: false };
        return testConnection();
      case 'resetCache':
        if (kind !== 'extension') return { ok: false };
        await resetCache();
        return { ok: true };
      case 'setPaused':
        await chrome.storage.local.set({ paused: Boolean(msg.paused) });
        return { ok: true, paused: Boolean(msg.paused) };
      default:
        return { ok: false, error: { status: 0, message: 'Mesaj necunoscut.' } };
    }
  };

  handle()
    .then(sendResponse)
    .catch((e) => sendResponse({ ok: false, error: { status: 0, message: String((e && e.message) || e) } }));
  return true; // răspuns asincron
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.paused) {
    refreshBadge();
    if (!changes.paused.newValue) scheduleFlush(500);
  }
  if ((area === 'local' && changes.token) || (area === 'sync' && changes.baseUrl)) {
    blockedByAuth = false;
    setLastError(null).then(() => scheduleFlush(500));
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  refreshBadge();
  if (details.reason === 'install') chrome.runtime.openOptionsPage();
  injectIntoOpenTabs();
});

/**
 * Chrome pune content script-urile doar în paginile încărcate după instalare. La instalare/actualizare le
 * injectăm și în tab-urile Facebook deja deschise (scripturile au protecție la injectare dublă).
 */
async function injectIntoOpenTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://www.facebook.com/*' });
    for (const tab of tabs) {
      if (!tab.id) continue;
      for (const files of [['extract.js', 'content-group.js'], ['extract.js', 'content-messenger.js']]) {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files }).catch(() => {});
      }
    }
  } catch {
    // fără tab-uri sau fără permisiune: utilizatorul poate apăsa F5
  }
}

chrome.runtime.onStartup.addListener(() => {
  refreshBadge();
});

// La repornirea service worker-ului: dacă a rămas ceva în coadă, îl trimitem.
loadQueue().then((q) => {
  if (q.length) scheduleFlush(DEBOUNCE_MS);
});
