/*
 * Contractez Copilot — content-queue.js
 * ---------------------------------------------------------------------------
 * Rulează pe /admin/leads/coada (contractez.ro sau localhost). E doar o punte între pagină și extensie:
 *   - răspunde la „cz-ping” cu „cz-pong”, ca pagina să știe că extensia e instalată;
 *   - la „cz-open-lead” (tasta C) cere service worker-ului să deschidă conversația în tab-ul Messenger al cozii
 *     (același tab, refolosit) și să țină minte lead-ul, ca să-l poată marca singur după ce trimiți.
 * Nu citește și nu modifică pagina.
 */
(function () {
  'use strict';
  if (window.__contractezQueueBridge) return;
  window.__contractezQueueBridge = true;

  const PATH = /^\/admin\/leads\/coada/;
  const post = (data) => window.postMessage({ source: 'cz-extension', ...data }, location.origin);
  const version = () => {
    try {
      return chrome.runtime.getManifest().version;
    } catch {
      return null; // extensia a fost reîncărcată
    }
  };

  window.addEventListener('message', (e) => {
    if (e.source !== window || e.origin !== location.origin || !PATH.test(location.pathname)) return;
    const d = e.data;
    if (!d || d.source !== 'cz-page') return;
    if (d.type === 'cz-ping') {
      if (version()) post({ type: 'cz-pong', version: version() });
      return;
    }
    if (d.type !== 'cz-open-lead' || !d.lead) return;
    chrome.runtime
      .sendMessage({ type: 'queueOpen', lead: d.lead, filters: d.filters || {} })
      .then((r) => post({ type: 'cz-open-lead-result', ok: Boolean(r && r.ok), error: (r && r.error && r.error.message) || null }))
      .catch((err) => post({ type: 'cz-open-lead-result', ok: false, error: String((err && err.message) || err) }));
  });

  if (version()) post({ type: 'cz-pong', version: version() });
})();
