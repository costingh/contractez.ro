// Contractez Copilot — document offscreen: copiază în clipboard mesajul următorului lead din coadă
// (service worker-ul nu are acces la clipboard). Doar copiere; nu citește clipboard-ul.
'use strict';

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.target !== 'offscreen' || msg.type !== 'copy') return false;
  const buf = document.getElementById('buf');
  buf.value = String(msg.text || '');
  buf.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  buf.value = '';
  sendResponse({ ok });
  return false;
});
