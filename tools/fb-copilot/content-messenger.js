/*
 * Contractez Copilot — content-messenger.js
 * ---------------------------------------------------------------------------
 * Rulează pe https://www.facebook.com/messages/* și se activează doar pe o conversație:
 *   /messages/t/<id>   sau   /messages/e2ee/t/<id>
 *
 * Când omul deschide o conversație:
 *   1. așteaptă să se încarce zona conversației și verifică dacă există deja mesaje
 *      (rânduri de mesaj randate în [role="main"]); o conversație goală = fără istoric;
 *   2. raportează o singură dată per conversație: POST /api/outreach/thread { hasHistory };
 *   3. afișează un banner: roșu dacă ați mai vorbit / persoana e deja contactată, discret altfel.
 *
 * NU scrie nimic în câmpul de mesaj, NU trimite nimic, NU dă click.
 *
 * De ce o singură raportare per conversație (per încărcare de pagină): după ce omul trimite
 * mesajul de outreach, conversația ARE istoric. Dacă am raporta din nou, serverul ar marca
 * greșit persoana ca „already_contacted”. Starea inițială e cea care contează.
 */
(function () {
  'use strict';

  /*
   * Protecție la injectare dublă, cu „puls”: o instanță vie scrie în DOM un timestamp la 2 s. După ce extensia e
   * reîncărcată, instanța veche își pierde contextul (chrome.runtime.id dispare) și nu mai pulsează, așa că
   * noua injectare (la instalare/actualizare sau la F5) poate porni chiar dacă flag-ul vechi a rămas setat.
   */
  const BEAT = 'czMessengerBeat';
  const runtimeAlive = () => {
    try {
      return Boolean(chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  };
  if (window.__contractezMessengerCopilot && Date.now() - Number(document.documentElement.dataset[BEAT] || 0) < 5000) return;
  window.__contractezMessengerCopilot = true;
  document.documentElement.dataset[BEAT] = String(Date.now());
  const beatTimer = setInterval(() => {
    if (!runtimeAlive()) {
      clearInterval(beatTimer);
      onRuntimeLost();
      return;
    }
    document.documentElement.dataset[BEAT] = String(Date.now());
  }, 2000);
  function onRuntimeLost() {
    document.querySelectorAll('contractez-banner').forEach((n) => n.remove());
  }

  const X = globalThis.ContractezExtract;
  if (!X) return;

  const URL_POLL_MS = 700;
  const CHECK_EVERY_MS = 500;
  const STABLE_EMPTY_MS = 2500; // conversația trebuie să rămână goală atât timp ca să o considerăm „fără istoric”
  const GIVE_UP_MS = 12000;

  /* ------------------------------------------------------------------------ */
  /* Heuristici DOM (Messenger) — de actualizat aici dacă Facebook schimbă UI-ul */
  /* ------------------------------------------------------------------------ */

  const MSEL = {
    main: '[role="main"]',
    /** Câmpul de scris: dacă există, conversația s-a încărcat. NU scriem în el. */
    composer: '[role="textbox"][contenteditable="true"], div[contenteditable="true"][aria-label]',
    loading: '[role="progressbar"], [aria-busy="true"]',
    /** Containerul listei de mesaje. */
    messageList:
      '[role="grid"], [aria-label^="Messages in conversation"], [aria-label^="Mesaje în conversația"], [aria-label^="Mesaje din conversația"], [aria-label^="Mesajele din conversația"]',
    /** Rânduri/bule de mesaj. Mai multe variante, ca să rezistăm la schimbări. */
    rows: '[role="row"], [data-testid="message-container"], [aria-roledescription="message"], [aria-roledescription="mesaj"]',
  };

  /**
   * Rânduri „de sistem” care apar și într-o conversație nouă (antetul cu profilul, criptarea etc.).
   * STRONG: o singură potrivire ajunge. WEAK („locuiește în”, „lucrează la”…) pot apărea și într-un
   * mesaj real, deci cer cel puțin două potriviri în același rând. Fără „salut”/„say hi”: sunt mesaje reale.
   */
  const INTRO_STRONG =
    /(you'?re friends on facebook|sunte[țt]i prieteni pe facebook|not friends on facebook|nu sunte[țt]i prieteni|view profile|vezi profilul|you are now connected|acum sunte[țt]i conecta[țt]i|mutual friends?|prieteni? comuni|end-to-end|criptare integral|criptate integral|messages and calls are secured|mesajele [șs]i apelurile|you can now message|acum pute[țt]i trimite mesaje)/i;
  const INTRO_WEAK = /(lives in|locuie[șs]te [îi]n|works at|lucreaz[aă] la|studied at|a studiat la|followers|urm[aă]ritori)/gi;

  function isIntroRow(text) {
    if (text.length > 400) return false;
    if (INTRO_STRONG.test(text)) return true;
    const weak = text.match(INTRO_WEAK);
    return Boolean(weak && new Set(weak.map((w) => w.toLowerCase())).size >= 2);
  }

  /**
   * @returns {{loaded: boolean, hasHistory: boolean, rows: number}}
   */
  function detectHistory() {
    const main = document.querySelector(MSEL.main);
    if (!main) return { loaded: false, hasHistory: false, rows: 0 };
    const scope = main.querySelector(MSEL.messageList) || main;
    let rows = 0;
    for (const r of scope.querySelectorAll(MSEL.rows)) {
      const text = (r.textContent || '').replace(/\s+/g, ' ').trim();
      const hasMedia = Boolean(r.querySelector('img:not([alt=""]), video, audio, [role="img"]'));
      if (!text && !hasMedia) continue;
      if (text && isIntroRow(text)) continue;
      rows++;
      if (rows >= 2) break;
    }
    // Părtinire conservatoare: orice rând de mesaj real = există istoric.
    if (rows > 0) return { loaded: true, hasHistory: true, rows };
    const loading = Boolean(main.querySelector(MSEL.loading));
    const loaded = !loading && Boolean(main.querySelector(MSEL.composer));
    return { loaded, hasHistory: false, rows: 0 };
  }

  /** Profilul persoanei din antetul conversației (linkurile din afara listei de mesaje). */
  function findProfile() {
    const main = document.querySelector(MSEL.main);
    if (!main) return null;
    const list = main.querySelector(MSEL.messageList);
    for (const a of main.querySelectorAll('a[href]')) {
      if (list && list.contains(a)) continue; // linkuri trimise în mesaje
      const p = X.parseProfileUrl(a.href);
      if (p) return p;
    }
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Flux                                                                       */
  /* ------------------------------------------------------------------------ */

  let currentHref = '';
  let checkTimer = null;
  let dead = false;
  /** threadUrl → rezultatul afișat (o singură raportare per conversație, per încărcare de pagină). */
  const reported = new Map();

  function onUrlMaybeChanged() {
    if (location.href === currentHref) return;
    currentHref = location.href;
    clearInterval(checkTimer);
    checkTimer = null;
    const t = X.parseThreadUrl(location.href);
    if (!t) {
      hideBanner();
      return;
    }
    const prev = reported.get(t.threadUrl);
    if (prev) {
      showBanner(prev);
      return;
    }
    startCheck(t);
  }

  function startCheck(thread) {
    if (document.hidden) {
      // Nu lucrăm pe tab-uri nevăzute; reluăm când utilizatorul revine.
      currentHref = '';
      return;
    }
    showBanner({ kind: 'checking' });
    const started = Date.now();
    let emptySince = null;
    checkTimer = setInterval(() => {
      if (location.href !== currentHref) return; // a schimbat conversația; onUrlMaybeChanged se ocupă
      const d = detectHistory();
      const now = Date.now();
      if (d.hasHistory) {
        clearInterval(checkTimer);
        finalize(thread, true);
        return;
      }
      if (d.loaded) {
        emptySince = emptySince || now;
        if (now - emptySince >= STABLE_EMPTY_MS) {
          clearInterval(checkTimer);
          finalize(thread, false);
          return;
        }
      } else {
        emptySince = null;
      }
      if (now - started > GIVE_UP_MS) {
        clearInterval(checkTimer);
        // Nu știm sigur → NU raportăm „fără istoric” la server.
        showBanner({ kind: 'unknown' });
      }
    }, CHECK_EVERY_MS);
  }

  async function finalize(thread, hasHistory) {
    const profile = findProfile();
    const payload = {
      threadUrl: thread.threadUrl,
      authorFbId: profile && profile.fbId ? profile.fbId : !thread.e2ee && /^\d+$/.test(thread.threadId) ? thread.threadId : null,
      authorProfileUrl: profile ? profile.profileUrl : null,
      hasHistory,
    };

    let paused = false;
    try {
      paused = Boolean((await chrome.storage.local.get({ paused: false })).paused);
    } catch (e) {
      dead = true;
    }

    let view;
    if (paused || dead) {
      view = { kind: hasHistory ? 'history' : 'first', note: dead ? 'Extensia a fost reîncărcată — dă refresh.' : 'Pauză — nu am întrebat serverul.' };
    } else {
      let res;
      try {
        res = await chrome.runtime.sendMessage({ type: 'thread', payload });
      } catch (e) {
        res = { ok: false, error: { message: String((e && e.message) || e) } };
      }
      if (!res || !res.ok) {
        view = {
          kind: hasHistory ? 'history' : 'first',
          note: 'Serverul nu a răspuns: ' + ((res && res.error && res.error.message) || 'eroare necunoscută'),
        };
      } else {
        const data = res.data || {};
        const contactedOnServer = ['contacted', 'replied', 'signed_up', 'already_contacted'].includes(data.status);
        view = {
          kind: hasHistory || contactedOnServer ? 'history' : 'first',
          note: contactedOnServer && !hasHistory ? 'Marcat ca deja contactat în Contractez.' : data.known ? 'Persoana apare în lead-urile Contractez.' : '',
        };
      }
    }
    // Rezultatul se reține doar dacă am primit un răspuns definitiv (ca să nu raportăm de două ori).
    if (!paused && !dead) reported.set(thread.threadUrl, view);
    if (X.parseThreadUrl(location.href)?.threadUrl === thread.threadUrl) showBanner(view);
  }

  /* ------------------------------------------------------------------------ */
  /* Banner (shadow DOM, poziționat fix — nu atinge layout-ul Messenger)        */
  /* ------------------------------------------------------------------------ */

  let host = null;
  const CSS = `
    :host { all: initial; position: fixed; top: 64px; left: 50%; transform: translateX(-50%); z-index: 2147483000; }
    .b { display: flex; align-items: center; gap: 10px; max-width: min(92vw, 640px); padding: 10px 14px; border-radius: 12px;
         font: 600 13px/1.35 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; box-shadow: 0 6px 24px rgba(15,23,42,.18); }
    .history { background: #dc2626; color: #fff; }
    .first   { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; font-weight: 500; box-shadow: 0 2px 10px rgba(15,23,42,.08); }
    .checking, .unknown { background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; font-weight: 500; }
    .unknown { background: #fffbeb; color: #92400e; border-color: #fcd34d; }
    .note { display: block; font-weight: 400; font-size: 11px; opacity: .9; margin-top: 2px; }
    .x { all: unset; cursor: pointer; font-size: 16px; line-height: 1; padding: 0 2px; opacity: .8; }
    .x:hover { opacity: 1; }
    .tag { font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; opacity: .75; }
  `;

  const TEXT = {
    history: 'Ai mai vorbit cu această persoană — nu trimite mesajul de outreach',
    first: 'Prima conversație',
    checking: 'Verific istoricul conversației…',
    unknown: 'Nu am putut verifica istoricul — derulează conversația și verifică manual înainte să trimiți.',
  };

  function showBanner(view) {
    if (!host) {
      host = document.createElement('contractez-banner');
      host.attachShadow({ mode: 'open' });
      host.shadowRoot.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('.x')) hideBanner();
      });
      document.documentElement.appendChild(host);
    }
    host.style.display = '';
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    host.shadowRoot.innerHTML = `<style>${CSS}</style>
      <div class="b ${view.kind}" role="status">
        <span class="tag">Contractez</span>
        <span>${esc(TEXT[view.kind])}${view.note ? `<span class="note">${esc(view.note)}</span>` : ''}</span>
        <button class="x" title="Închide" aria-label="Închide">×</button>
      </div>`;
  }

  function hideBanner() {
    if (host) host.style.display = 'none';
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) onUrlMaybeChanged();
  });

  onUrlMaybeChanged();
  setInterval(() => {
    if (!document.hidden) onUrlMaybeChanged();
  }, URL_POLL_MS);
})();
