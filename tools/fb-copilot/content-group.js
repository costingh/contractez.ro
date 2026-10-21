/*
 * Contractez Copilot — content-group.js
 * ---------------------------------------------------------------------------
 * Rulează pe paginile de grup Facebook (https://www.facebook.com/groups/*).
 *
 * CE FACE:
 *   - observă (MutationObserver, cu throttle) feed-ul și dialogurile de postare;
 *   - citește DOAR articolele pe care utilizatorul le-a avut pe ecran (IntersectionObserver);
 *   - le trimite service worker-ului, care le strânge în loturi spre server;
 *   - afișează un chip mic cu statusul fiecărui item și un panou plutitor (stânga-jos).
 *
 * CE NU FACE NICIODATĂ:
 *   - nu dă click pe nimic (nici „Vezi mai mult”, nici „Vezi mai multe comentarii”);
 *   - nu derulează, nu navighează, nu scrie în câmpuri, nu trimite mesaje;
 *   - nu lucrează când tab-ul nu e vizibil sau când e pus pe pauză.
 */
(function () {
  'use strict';

  if (window.__contractezGroupCopilot) return; // protecție la injectare dublă
  window.__contractezGroupCopilot = true;

  const X = globalThis.ContractezExtract;
  if (!X) return;

  const SCAN_MIN_INTERVAL = 1200; // ms între două scanări
  const MAX_ARTICLES_PER_SCAN = 30; // restul la scanarea următoare
  const RETRY_SKIPPED_MS = 2500; // reîncercăm un articol fără id/text cel mult o dată la 2,5 s
  const TRUNCATED_GRACE_MS = 15000; // așteptăm ca omul să apese „Vezi mai mult”, apoi trimitem ce e
  const STATUS_INTERVAL_MS = 10000;
  const URL_POLL_MS = 1000;

  /* ------------------------------------------------------------------------ */
  /* Stare                                                                     */
  /* ------------------------------------------------------------------------ */

  const state = {
    active: false,
    paused: false,
    dead: false, // contextul extensiei a dispărut (extensia a fost reîncărcată)
    baseUrl: 'https://contractez.ro',
    href: location.href,
    group: null, // { groupId, postId, numericGroupId, groupName }
    counters: { read: 0, sentNew: 0, duplicates: 0 },
    lastError: null,
    collapsed: false,
  };

  /**
   * fbItemId → { id, item, els: Set<Element>, group, state: 'pending'|'queued'|'sent'|'cached', lead, firstSeen, truncated, anonymous }
   * `els`: același item poate apărea de două ori (în feed și în dialogul postării).
   * `group`: obiectul grupului în care a fost citit (contează dacă utilizatorul schimbă grupul înainte de trimitere).
   */
  const records = new Map();
  /** element → { id } sau { skip, lastTry } */
  const elInfo = new WeakMap();
  const observedEls = new WeakSet();
  const seenEls = new WeakSet(); // au fost cel puțin o dată pe ecran
  const visibleEls = new Set();
  const chipHosts = new WeakMap(); // element → <contractez-chip>

  /* ------------------------------------------------------------------------ */
  /* Utilitare                                                                 */
  /* ------------------------------------------------------------------------ */

  const idle = (fn) =>
    typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 50);

  function send(msg) {
    if (state.dead) return Promise.resolve({ ok: false, dead: true });
    try {
      return chrome.runtime.sendMessage(msg).catch((e) => handleSendError(e));
    } catch (e) {
      return Promise.resolve(handleSendError(e));
    }
  }

  function handleSendError(e) {
    const m = String((e && e.message) || e);
    if (/context invalidated|Extension context/i.test(m)) {
      state.dead = true;
      state.lastError = 'Extensia a fost reîncărcată — dă refresh paginii.';
      deactivate();
      renderPanel();
    }
    return { ok: false, dead: state.dead, error: { status: 0, message: m } };
  }

  function groupAliases() {
    if (!state.group) return [];
    return [state.group.groupId, state.group.numericGroupId].filter(Boolean);
  }

  /* ------------------------------------------------------------------------ */
  /* Activare / dezactivare (Facebook e SPA: URL-ul se schimbă fără reload)     */
  /* ------------------------------------------------------------------------ */

  let mo = null;
  let io = null;
  let statusTimer = null;

  function activate() {
    if (state.active || state.dead) return;
    const g = X.parseGroupUrl(location.href);
    if (!g) return;
    state.active = true;
    setGroup(g);

    io = new IntersectionObserver(onIntersect, { threshold: [0, 0.02, 0.05, 0.1, 0.25, 0.5] });
    mo = new MutationObserver(onMutations);
    // Observăm body (feed-ul și dialogurile apar/dispar dinamic); callback-ul doar programează o scanare.
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'aria-label'] });
    statusTimer = setInterval(pollStatus, STATUS_INTERVAL_MS);
    renderPanel();
    requestScan();
  }

  function deactivate() {
    state.active = false;
    if (mo) mo.disconnect();
    if (io) io.disconnect();
    clearInterval(statusTimer);
    mo = io = statusTimer = null;
    visibleEls.clear();
    renderPanel();
  }

  function setGroup(g) {
    const changed = !state.group || state.group.groupId !== g.groupId;
    if (changed) {
      state.group = { groupId: g.groupId, postId: g.postId, numericGroupId: /^\d+$/.test(g.groupId) ? g.groupId : null, groupName: null };
      state.counters = { read: 0, sentNew: 0, duplicates: 0 };
    } else {
      state.group.postId = g.postId;
    }
    state.group.groupName = X.readGroupName(document, g.groupId) || state.group.groupName;
  }

  function onUrlMaybeChanged() {
    if (location.href === state.href) return;
    state.href = location.href;
    const g = X.parseGroupUrl(location.href);
    if (!g) {
      if (state.active) deactivate();
      return;
    }
    if (!state.active) activate();
    else {
      setGroup(g);
      requestScan();
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Observatori                                                               */
  /* ------------------------------------------------------------------------ */

  function isOurNode(n) {
    return n && n.nodeType === 1 && (n.localName === 'contractez-chip' || n.localName === 'contractez-panel');
  }

  function onMutations(muts) {
    // Ieftin: ignorăm mutațiile produse de propriile noastre chip-uri, restul doar programează o scanare.
    for (const m of muts) {
      if (m.type === 'attributes') {
        requestScan();
        return;
      }
      for (const n of m.addedNodes) {
        if (!isOurNode(n)) {
          requestScan();
          return;
        }
      }
      for (const n of m.removedNodes) {
        if (!isOurNode(n)) {
          requestScan();
          return;
        }
      }
    }
  }

  function onIntersect(entries) {
    let any = false;
    for (const e of entries) {
      // „Pe ecran” = un sfert din articol SAU măcar 200 px din el (postările lungi nu ajung la 25%).
      if (e.isIntersecting && (e.intersectionRatio >= 0.25 || e.intersectionRect.height >= 200)) {
        visibleEls.add(e.target);
        if (!seenEls.has(e.target)) {
          seenEls.add(e.target);
          any = true;
        }
      } else {
        visibleEls.delete(e.target);
      }
    }
    if (any) requestScan();
  }

  let scanScheduled = false;
  let lastScan = 0;

  function requestScan() {
    if (!state.active || state.paused || state.dead || document.hidden || scanScheduled) return;
    scanScheduled = true;
    const wait = Math.max(0, SCAN_MIN_INTERVAL - (Date.now() - lastScan));
    setTimeout(
      () =>
        idle(() => {
          scanScheduled = false;
          lastScan = Date.now();
          try {
            scan();
          } catch (e) {
            console.warn('[Contractez] scan', e);
          }
        }),
      wait,
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Scanare & extracție                                                       */
  /* ------------------------------------------------------------------------ */

  function getRoots() {
    const roots = [];
    for (const r of document.querySelectorAll(X.SEL.roots)) {
      if (r.getAttribute('role') === 'dialog') {
        // Doar dialogurile care chiar conțin o postare/comentarii (nu meniuri, notificări, chat).
        if (!r.querySelector(X.SEL.message) && !r.querySelector('[role="article"][aria-label]')) continue;
      }
      roots.push(r);
    }
    // Pagina unei singure postări: nu are feed, postarea e direct în [role="main"].
    if (state.group && state.group.postId && !roots.some((r) => r.getAttribute('role') === 'feed')) {
      const main = document.querySelector(X.SEL.mainRoot);
      if (main) roots.push(main);
    }
    return roots;
  }

  function scan() {
    if (!state.active || state.paused || document.hidden) return;
    if (!state.group.groupName) state.group.groupName = X.readGroupName(document, state.group.groupId);

    const arts = X.findArticles(getRoots());
    for (const { el } of arts) {
      if (!observedEls.has(el)) {
        observedEls.add(el);
        io.observe(el);
      }
    }

    let processed = 0;
    let leftover = false;
    let deferred = false;
    const now = Date.now();
    for (const a of arts) {
      if (!seenEls.has(a.el)) continue; // încă nu a fost pe ecran → nu îl citim
      const info = elInfo.get(a.el);
      if (info && info.id) {
        const rec = records.get(info.id);
        // Re-citim doar postările trunchiate (poate omul a apăsat „Vezi mai mult”).
        if (!(rec && rec.state === 'pending' && rec.truncated)) {
          if (rec) {
            rec.els.add(a.el);
            ensureChip(rec);
          }
          continue;
        }
      } else if (info && info.skip && now - info.lastTry < RETRY_SKIPPED_MS) {
        deferred = true; // ex. FB a completat href-ul timestamp-ului la hover → îl reluăm puțin mai târziu
        continue;
      }
      if (processed >= MAX_ARTICLES_PER_SCAN) {
        leftover = true;
        break;
      }
      processed++;
      processArticle(a.el, a.kind, now);
    }

    for (const el of visibleEls) if (!el.isConnected) visibleEls.delete(el);
    for (const rec of records.values()) for (const el of rec.els) if (!el.isConnected) rec.els.delete(el);
    flushPending();
    if (leftover) requestScan();
    else if (deferred && !retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        requestScan();
      }, RETRY_SKIPPED_MS);
    }
  }

  let retryTimer = null;

  function parentPostHint(el) {
    let p = el.parentElement && el.parentElement.closest(X.SEL.article);
    while (p) {
      const info = elInfo.get(p);
      if (!X.isCommentElement(p)) {
        if (info && info.id && info.id.startsWith('post:')) return info.id.slice(5);
        break;
      }
      p = p.parentElement && p.parentElement.closest(X.SEL.article);
    }
    return state.group.postId || null;
  }

  function processArticle(el, kind, now) {
    const isMainPost = kind === 'post' && Boolean(state.group.postId) && !el.closest('[role="feed"]');
    const snap = X.snapshotArticle(el, {
      kind,
      groupAliases: groupAliases(),
      pagePostId: isMainPost ? state.group.postId : null,
      parentPostIdHint: kind === 'comment' ? parentPostHint(el) : null,
    });
    const r = X.buildItem(snap);
    if (r.skip) {
      elInfo.set(el, { skip: r.skip, lastTry: now });
      return;
    }
    if (r.numericGroupId && !state.group.numericGroupId && r.numericGroupId !== state.group.groupId) {
      state.group.numericGroupId = r.numericGroupId; // URL cu slug → am aflat id-ul numeric din permalink
    }
    const id = r.item.fbItemId;
    let rec = records.get(id);
    if (!rec) {
      rec = {
        id,
        item: r.item,
        els: new Set([el]),
        group: state.group,
        state: 'pending',
        lead: null,
        firstSeen: now,
        truncated: r.truncated,
        anonymous: r.anonymous,
      };
      records.set(id, rec);
      state.counters.read++;
      renderPanel();
    } else {
      rec.els.add(el);
      if (rec.state === 'pending' && r.item.text.length >= rec.item.text.length) {
        rec.item = r.item;
        rec.truncated = r.truncated;
      }
    }
    elInfo.set(el, { id });
    ensureChip(rec);
  }

  let truncatedTimer = null;
  let flushing = false;

  async function flushPending() {
    if (flushing || state.paused || state.dead) return;
    const now = Date.now();
    const ready = [];
    let waiting = false;
    for (const rec of records.values()) {
      if (rec.state !== 'pending') continue;
      if (rec.truncated && now - rec.firstSeen < TRUNCATED_GRACE_MS) {
        waiting = true;
        continue;
      }
      ready.push(rec);
    }
    if (waiting && !truncatedTimer) {
      truncatedTimer = setTimeout(() => {
        truncatedTimer = null;
        flushPending();
      }, 4000);
    }
    if (!ready.length) return;

    // Câte un mesaj per grup (contractul are un singur groupId per cerere), max 50 itemi.
    const chunks = [];
    const byGroup = new Map();
    for (const rec of ready) {
      if (!byGroup.has(rec.group)) byGroup.set(rec.group, []);
      byGroup.get(rec.group).push(rec);
    }
    for (const [group, list] of byGroup) {
      for (let i = 0; i < list.length; i += 50) chunks.push({ group, list: list.slice(i, i + 50) });
    }

    flushing = true;
    try {
      for (const { group, list: chunk } of chunks) {
        for (const rec of chunk) rec.state = 'queued';
        const res = await send({
          type: 'ingest',
          groupId: group.numericGroupId || group.groupId,
          groupName: group.groupName || null,
          items: chunk.map((r) => r.item),
        });
        if (!res || !res.ok) {
          for (const rec of chunk) rec.state = 'pending'; // reîncercăm la următoarea scanare
          if (res && res.error) state.lastError = res.error.message;
          break;
        }
        const cached = new Set(res.cached || []);
        for (const rec of chunk) {
          if (cached.has(rec.id)) {
            rec.state = 'cached';
            state.counters.duplicates++;
          }
        }
        if (cached.size) scheduleStatusSoon();
      }
    } finally {
      flushing = false;
      for (const rec of ready) ensureChip(rec);
      renderPanel();
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Statusuri (chip-uri)                                                      */
  /* ------------------------------------------------------------------------ */

  let statusSoonTimer = null;
  function scheduleStatusSoon() {
    clearTimeout(statusSoonTimer);
    statusSoonTimer = setTimeout(pollStatus, 1000);
  }

  async function pollStatus() {
    if (!state.active || state.paused || state.dead || document.hidden) return;
    const ids = [];
    for (const rec of records.values()) {
      if (rec.state === 'pending') continue;
      if (!Array.from(rec.els).some((el) => visibleEls.has(el))) continue;
      ids.push(rec.id);
      if (ids.length >= 100) break;
    }
    if (!ids.length) return;
    const res = await send({ type: 'status', ids });
    if (!res || !res.ok) {
      if (res && res.error) state.lastError = res.error.message;
      renderPanel();
      return;
    }
    if (state.lastError && !state.dead) state.lastError = null;
    for (const lead of res.leads || []) applyLead(lead);
    renderPanel();
  }

  function applyLead(lead) {
    const rec = records.get(lead.fbItemId);
    if (!rec) return;
    rec.lead = lead;
    if (rec.state === 'queued' || rec.state === 'cached') rec.state = 'sent';
    ensureChip(rec);
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'ping') {
      sendResponse({ ok: true, script: 'group', active: state.active, counters: state.counters });
      return;
    }
    if (msg.type === 'ingestResult') {
      state.counters.sentNew += msg.accepted || 0;
      state.counters.duplicates += msg.duplicates || 0;
      state.lastError = null;
      for (const id of msg.ids || []) {
        const rec = records.get(id);
        if (rec && rec.state === 'queued') rec.state = 'sent';
      }
      for (const lead of msg.leads || []) applyLead(lead);
      for (const id of msg.ids || []) {
        const rec = records.get(id);
        if (rec) ensureChip(rec);
      }
      renderPanel();
    } else if (msg.type === 'apiError') {
      state.lastError = (msg.error && msg.error.message) || 'Eroare necunoscută.';
      renderPanel();
    }
  });

  /* ------------------------------------------------------------------------ */
  /* Chip-uri (shadow DOM, nu ating stilurile Facebook)                         */
  /* ------------------------------------------------------------------------ */

  const CHIP_CSS = `
    :host { all: initial; display: inline-block; vertical-align: middle; margin: 0 0 0 6px; line-height: 1; }
    a { display: inline-block; font: 600 11px/1.3 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        padding: 1px 7px; border-radius: 999px; border: 1px solid transparent; text-decoration: none;
        white-space: nowrap; cursor: pointer; letter-spacing: .01em; }
    a:hover { filter: brightness(.96); text-decoration: underline; }
    .pending  { background: #f1f5f9; color: #64748b; border-color: #e2e8f0; }
    .new      { background: #eef2ff; color: #3730a3; border-color: #c7d2fe; }
    .client   { background: #dcfce7; color: #166534; border-color: #86efac; }
    .provider { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
    .irrelevant, .skipped { background: #f3f4f6; color: #6b7280; border-color: #e5e7eb; }
    .contacted { background: #f3e8ff; color: #6b21a8; border-color: #d8b4fe; }
    .already  { background: #ffedd5; color: #9a3412; border-color: #fdba74; }
    .replied  { background: #ccfbf1; color: #115e59; border-color: #5eead4; }
    .signed   { background: #14532d; color: #f0fdf4; border-color: #14532d; }
  `;

  function chipView(rec) {
    const lead = rec.lead;
    if (!lead) {
      if (rec.state === 'pending') return { cls: 'pending', text: rec.truncated ? 'Aștept textul…' : 'În coadă…', title: 'Încă netrimis la server.' };
      if (rec.state === 'queued') return { cls: 'pending', text: 'Se trimite…', title: 'În lotul următor spre server.' };
      return { cls: 'new', text: 'Nou…', title: 'Trimis; așteaptă clasificarea.' };
    }
    const score = typeof lead.score === 'number' ? ' ' + lead.score : '';
    let v;
    switch (lead.status) {
      case 'new':
        v = { cls: 'new', text: 'Nou…', title: 'Așteaptă clasificarea AI.' };
        break;
      case 'scored':
        if (lead.type === 'client') v = { cls: 'client', text: 'Client' + score, title: 'Caută prestator.' };
        else if (lead.type === 'provider') v = { cls: 'provider', text: 'Prestator' + score, title: 'Oferă servicii.' };
        else if (lead.type === 'irrelevant') v = { cls: 'irrelevant', text: 'Irelevant', title: '' };
        else v = { cls: 'new', text: 'Scor' + score, title: '' };
        break;
      case 'irrelevant':
        v = { cls: 'irrelevant', text: 'Irelevant', title: 'Clasificat fără legătură.' };
        break;
      case 'contacted':
        v = { cls: 'contacted', text: 'Contactat', title: 'Mesaj trimis prin copilot.' };
        break;
      case 'already_contacted':
        v = { cls: 'already', text: 'Deja contactat', title: 'Ai mai vorbit cu această persoană.' };
        break;
      case 'skipped':
        v = { cls: 'skipped', text: rec.anonymous ? 'Anonim' : 'Ignorat', title: 'Autor anonim sau fără profil.' };
        break;
      case 'replied':
        v = { cls: 'replied', text: 'A răspuns', title: '' };
        break;
      case 'signed_up':
        v = { cls: 'signed', text: 'Înscris', title: 'S-a înscris pe Contractez.' };
        break;
      default:
        v = { cls: 'new', text: String(lead.status || 'Nou…'), title: '' };
    }
    if (lead.personContacted && (lead.status === 'new' || lead.status === 'scored')) {
      v = { cls: 'already', text: v.text + ' · contactat', title: 'Persoana a mai fost contactată pentru alt item.' };
    }
    return v;
  }

  /** Unde punem chip-ul: imediat după linkul cu numele autorului (inline, nu mută layout-ul). */
  function chipAnchor(el) {
    const nested = Array.from(el.querySelectorAll(X.SEL.article)).filter((n) => n !== el && X.isCommentElement(n));
    const own = (n) => !nested.some((c) => c.contains(n));
    for (const a of el.querySelectorAll('a[href]')) {
      if (!own(a)) continue;
      if (a.closest(X.SEL.message)) continue;
      if (!(a.textContent || '').trim()) continue; // avatarul nu are text
      if (X.parseProfileUrl(a.href)) return { node: a, where: 'afterend' };
    }
    const h = Array.from(el.querySelectorAll('h2, h3, h4')).find(own);
    if (h) return { node: h, where: 'beforeend' };
    return null;
  }

  function ensureChip(rec) {
    for (const el of rec.els) ensureChipOn(el, rec);
  }

  function ensureChipOn(el, rec) {
    if (!el || !el.isConnected) return;
    let host = chipHosts.get(el);
    if (!host || !host.isConnected || !el.contains(host)) {
      const at = chipAnchor(el);
      if (!at) return;
      host = document.createElement('contractez-chip');
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<style>${CHIP_CSS}</style><a target="_blank" rel="noopener noreferrer"></a>`;
      // Click-ul pe chip nu trebuie să ajungă la handler-ele Facebook (ex. deschiderea postării).
      for (const ev of ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup']) {
        host.addEventListener(ev, (e) => e.stopPropagation());
      }
      at.node.insertAdjacentElement(at.where, host);
      chipHosts.set(el, host);
    }
    const v = chipView(rec);
    const a = host.shadowRoot.querySelector('a');
    const key = v.cls + '|' + v.text + '|' + state.baseUrl;
    if (a.dataset.key === key) return;
    a.dataset.key = key;
    a.className = v.cls;
    a.textContent = v.text;
    a.title = 'Contractez: ' + (v.title || v.text) + ' — deschide /admin/leads';
    a.href = state.baseUrl + '/admin/leads';
  }

  /* ------------------------------------------------------------------------ */
  /* Panou plutitor (stânga-jos, pliabil)                                      */
  /* ------------------------------------------------------------------------ */

  let panelHost = null;
  let panelRaf = 0;

  const PANEL_CSS = `
    :host { all: initial; position: fixed; left: 16px; bottom: 16px; z-index: 2147483000; }
    * { box-sizing: border-box; }
    .box { font: 12px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #0f172a;
           background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 6px 24px rgba(15,23,42,.14);
           width: 232px; overflow: hidden; }
    .head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #142340; color: #fff; cursor: pointer; user-select: none; }
    .head b { font-size: 12px; font-weight: 700; flex: 1; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #4cc38a; flex: none; }
    .dot.paused { background: #94a3b8; } .dot.err { background: #f87171; } .dot.off { background: #64748b; }
    .tog { font-size: 11px; opacity: .8; }
    .body { padding: 8px 10px 10px; }
    .row { display: flex; justify-content: space-between; padding: 2px 0; }
    .row span:last-child { font-weight: 700; font-variant-numeric: tabular-nums; }
    .err { margin-top: 6px; padding: 6px 8px; border-radius: 8px; background: #fef2f2; color: #991b1b; font-size: 11px; word-break: break-word; }
    .muted { color: #64748b; font-size: 11px; margin-top: 6px; }
    .actions { display: flex; gap: 6px; margin-top: 8px; }
    button, a.btn { all: unset; font: 600 11px/1 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; padding: 6px 8px;
           border-radius: 8px; border: 1px solid #cbd5e1; color: #0f172a; cursor: pointer; text-align: center; flex: 1; }
    button:hover, a.btn:hover { background: #f1f5f9; }
    button.on { background: #fef3c7; border-color: #fcd34d; }
    .mini { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #142340; color: #fff;
            font: 700 12px/1 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; cursor: pointer; box-shadow: 0 4px 16px rgba(15,23,42,.2); }
    @media (prefers-color-scheme: dark) {
      .box { background: #1e293b; color: #e2e8f0; border-color: #334155; }
      button, a.btn { color: #e2e8f0; border-color: #475569; } button:hover, a.btn:hover { background: #334155; }
      button.on { background: #78350f; border-color: #b45309; }
      .err { background: #450a0a; color: #fecaca; } .muted { color: #94a3b8; }
    }
  `;

  function renderPanel() {
    if (panelRaf) return;
    panelRaf = requestAnimationFrame(() => {
      panelRaf = 0;
      drawPanel();
    });
  }

  function drawPanel() {
    if (!state.active && !state.dead) {
      if (panelHost) panelHost.style.display = 'none';
      return;
    }
    if (!panelHost) {
      panelHost = document.createElement('contractez-panel');
      panelHost.attachShadow({ mode: 'open' });
      panelHost.shadowRoot.addEventListener('click', onPanelClick);
      document.documentElement.appendChild(panelHost);
    }
    panelHost.style.display = '';
    const c = state.counters;
    const dotCls = state.dead ? 'off' : state.paused ? 'paused' : state.lastError ? 'err' : '';
    const queued = Array.from(records.values()).filter((r) => r.state === 'pending' || r.state === 'queued').length;
    const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

    if (state.collapsed) {
      panelHost.shadowRoot.innerHTML = `<style>${PANEL_CSS}</style>
        <div class="mini" data-act="expand" title="Contractez Copilot — deschide panoul">
          <span class="dot ${dotCls}"></span>C · ${c.read}${state.paused ? ' · pauză' : ''}
        </div>`;
      return;
    }
    panelHost.shadowRoot.innerHTML = `<style>${PANEL_CSS}</style>
      <div class="box">
        <div class="head" data-act="collapse" title="Pliază">
          <span class="dot ${dotCls}"></span><b>Contractez Copilot</b><span class="tog">▾</span>
        </div>
        <div class="body">
          <div class="row"><span>Citite</span><span>${c.read}</span></div>
          <div class="row"><span>Trimise noi</span><span>${c.sentNew}</span></div>
          <div class="row"><span>Duplicate</span><span>${c.duplicates}</span></div>
          ${queued ? `<div class="row"><span>În așteptare</span><span>${queued}</span></div>` : ''}
          ${state.lastError ? `<div class="err">${esc(state.lastError)}</div>` : ''}
          ${state.paused ? '<div class="muted">În pauză — nu citesc și nu trimit nimic.</div>' : '<div class="muted">Citesc doar ce derulezi tu. Nu dau click, nu trimit mesaje.</div>'}
          <div class="actions">
            <button data-act="pause" class="${state.paused ? 'on' : ''}">${state.paused ? 'Reia' : 'Pauză'}</button>
            <a class="btn" href="${esc(state.baseUrl)}/admin/leads" target="_blank" rel="noopener noreferrer">Lead-uri</a>
          </div>
        </div>
      </div>`;
  }

  function onPanelClick(e) {
    const t = e.target.closest && e.target.closest('[data-act]');
    if (!t) return;
    const act = t.getAttribute('data-act');
    if (act === 'collapse' || act === 'expand') {
      state.collapsed = act === 'collapse';
      chrome.storage.local.set({ panelCollapsed: state.collapsed }).catch(() => {});
      renderPanel();
    } else if (act === 'pause') {
      chrome.storage.local.set({ paused: !state.paused }).catch(() => {});
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Configurare & pornire                                                     */
  /* ------------------------------------------------------------------------ */

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.paused) {
      state.paused = Boolean(changes.paused.newValue);
      renderPanel();
      if (!state.paused) {
        requestScan();
        flushPending();
      }
    }
    if (area === 'sync' && changes.baseUrl) {
      state.baseUrl = String(changes.baseUrl.newValue || 'https://contractez.ro').replace(/\/+$/, '');
      for (const rec of records.values()) ensureChip(rec);
      renderPanel();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      requestScan();
      pollStatus();
    }
  });

  async function init() {
    try {
      const [{ baseUrl }, { paused, panelCollapsed }] = await Promise.all([
        chrome.storage.sync.get({ baseUrl: 'https://contractez.ro' }),
        chrome.storage.local.get({ paused: false, panelCollapsed: false }),
      ]);
      state.baseUrl = String(baseUrl || 'https://contractez.ro').replace(/\/+$/, '');
      state.paused = Boolean(paused);
      state.collapsed = Boolean(panelCollapsed);
    } catch (e) {
      handleSendError(e);
      return;
    }
    activate();
    // FB e SPA: verificăm URL-ul periodic (content script-ul nu poate intercepta history.pushState).
    setInterval(() => {
      if (!state.dead) onUrlMaybeChanged();
    }, URL_POLL_MS);
  }

  init();
})();
