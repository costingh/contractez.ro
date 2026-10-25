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
 * NU scrie nimic în câmpul de mesaj și NU trimite nimic.
 *
 * Tab-ul cozii (deschis de extensie din /admin/leads/coada; service worker-ul îi știe id-ul și lead-ul curent):
 *   - dacă o conversație fără istoric arată „Începe conversația” / „Continuă”, apasă butonul o dată și pune
 *     cursorul în câmpul de mesaj. Lipirea mesajului și Enter rămân la om;
 *   - când apare mesajul trimis de om (câmpul de scris s-a golit), marchează lead-ul „trimis”; dacă ați mai
 *     vorbit, serverul îl marchează „deja contactat”; butonul „Sari” din banner îl sare;
 *   - apoi cere următorul lead (mesajul lui ajunge în clipboard) și, după o numărătoare inversă pe care o poți
 *     opri, service worker-ul mută tab-ul la conversația lui.
 * În Messenger-ul folosit normal (orice alt tab) extensia doar verifică istoricul și nu apasă nimic.
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
  const SEND_POLL_MS = 700;
  const ADVANCE_SECONDS = 4; // numărătoarea până la următoarea conversație (o poți opri)

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
  /* „Începe conversația” (doar în tab-ul cozii)                                */
  /* ------------------------------------------------------------------------ */

  /** Potrivire exactă pe eticheta butonului; orice altceva (Trimite, Apel, Blochează…) e ignorat. */
  const START_LABEL = /^(start(?: a)? (?:new )?(?:conversation|chat)|[îi]ncepe(?: o)? conversa[țt]i[ae]|[îi]ncepe (?:un )?chat(?:ul)?|continu[ăa]|continue)$/i;
  const NEVER_LABEL = /(trimite|send|apel|call|[șs]terge|delete|bloc|block|raporteaz|report|ignor)/i;
  const startClicked = new Set();
  const focused = new Set();
  const startNotes = new Map();

  /**
   * Lead-ul pentru care coada a deschis acest tab (îl știe doar service worker-ul). E legat de prima conversație
   * verificată după încărcare: dacă treci la altă conversație în același tab, automatizarea se oprește.
   */
  let queueCtx = null;
  let queueThread = null;
  const queueReady = (async () => {
    try {
      const r = await chrome.runtime.sendMessage({ type: 'queueContext' });
      if (r && r.ok && r.leadId) queueCtx = { leadId: r.leadId, authorName: r.authorName || null };
    } catch {
      /* extensie reîncărcată */
    }
  })();
  const fromQueue = () => Boolean(queueCtx);

  function findStartButton() {
    const main = document.querySelector(MSEL.main);
    const list = main && main.querySelector(MSEL.messageList);
    const scopes = [...document.querySelectorAll('[role="dialog"]'), main].filter(Boolean);
    for (const scope of scopes) {
      for (const b of scope.querySelectorAll('button, [role="button"]')) {
        if (list && list.contains(b)) continue; // butoane din mesaje
        if (b.closest(MSEL.composer)) continue;
        if (b.disabled || b.getAttribute('aria-disabled') === 'true') continue;
        const label = (b.getAttribute('aria-label') || b.textContent || '').replace(/\s+/g, ' ').trim();
        if (!START_LABEL.test(label) || NEVER_LABEL.test(label)) continue;
        const r = b.getBoundingClientRect();
        if (!r.width || !r.height) continue; // invizibil
        return { el: b, label };
      }
    }
    return null;
  }

  /** O singură apăsare per conversație, doar pe o conversație fără istoric, doar în tab-ul cozii, doar pe tab vizibil. */
  function maybeStartConversation(thread) {
    if (!fromQueue() || document.hidden || startClicked.has(thread.threadUrl)) return;
    const found = findStartButton();
    if (!found) return;
    startClicked.add(thread.threadUrl);
    found.el.click();
    startNotes.set(thread.threadUrl, `Am apăsat „${found.label}”.`);
  }

  /** Pune cursorul în câmpul de mesaj, ca ⌘V să meargă direct. Nu scrie nimic în el. */
  function focusComposer(thread) {
    if (!fromQueue() || document.hidden || focused.has(thread.threadUrl)) return;
    const main = document.querySelector(MSEL.main);
    const box = main && main.querySelector(MSEL.composer);
    if (!box) return;
    focused.add(thread.threadUrl);
    box.focus();
  }

  /** Câmpul de scris e gol (după Enter, Messenger îl golește). Nu îl modificăm. */
  function composerEmpty() {
    const main = document.querySelector(MSEL.main);
    const box = main && main.querySelector(MSEL.composer);
    return Boolean(box) && !(box.textContent || '').replace(/[\s\u200b\ufeff]+/g, '');
  }

  /* ------------------------------------------------------------------------ */
  /* Coada: trimis → următorul                                                  */
  /* ------------------------------------------------------------------------ */

  let sendTimer = null;
  let countdownTimer = null;

  /** Conversația era goală; când apare un mesaj și câmpul de scris s-a golit (de două ori la rând) = ai trimis. */
  function watchSend(thread) {
    clearInterval(sendTimer);
    let hits = 0;
    sendTimer = setInterval(() => {
      if (!fromQueue() || X.parseThreadUrl(location.href)?.threadUrl !== thread.threadUrl) {
        clearInterval(sendTimer);
        return;
      }
      hits = detectHistory().hasHistory && composerEmpty() ? hits + 1 : 0;
      if (hits >= 2) {
        clearInterval(sendTimer);
        void queueAdvance(thread, 'sent');
      }
    }, SEND_POLL_MS);
  }

  /**
   * intent: 'sent' (am văzut mesajul trimis), 'skip' (butonul „Sari”), 'history' (serverul l-a marcat deja contactat),
   * 'next' (doar treci mai departe, fără să marchezi).
   */
  async function queueAdvance(thread, intent) {
    if (!fromQueue()) return;
    clearInterval(sendTimer);
    const ctx = queueCtx;
    const base = { kind: intent === 'history' ? 'history' : 'done' };
    const show = (v) => {
      if (X.parseThreadUrl(location.href)?.threadUrl === thread.threadUrl) showBanner({ ...base, ...v });
    };
    if (intent === 'sent' || intent === 'skip') {
      show({ text: intent === 'sent' ? 'Trimis — îl marchez în Contractez…' : 'Îl sar…' });
      let r;
      try {
        r = await chrome.runtime.sendMessage({ type: intent === 'sent' ? 'queueSent' : 'queueSkip', leadId: ctx.leadId });
      } catch (e) {
        r = { ok: false, error: { message: String((e && e.message) || e) } };
      }
      if (!r || !r.ok) {
        const reason = (r && r.error && r.error.message) || 'eroare necunoscută';
        show({ kind: 'unknown', text: `Nu am putut marca lead-ul: ${reason}`, actions: queueActions(intent === 'sent' ? ['retrySent', 'next', 'stop'] : ['skip', 'next', 'stop']) });
        return;
      }
    }
    const done = intent === 'sent' ? 'Trimis ✓' : intent === 'skip' ? 'Sărit ✓' : intent === 'history' ? 'Ai mai vorbit cu această persoană — sărit' : '';
    show({ text: `${done ? done + '. ' : ''}Caut următorul lead…` });
    let n;
    try {
      n = await chrome.runtime.sendMessage({ type: 'queueNext' });
    } catch (e) {
      n = { ok: false, error: { message: String((e && e.message) || e) } };
    }
    if (!n || !n.ok) {
      show({ kind: 'unknown', text: `${done ? done + '. ' : ''}Nu am putut lua următorul lead: ${(n && n.error && n.error.message) || 'eroare'}`, actions: queueActions(['next', 'stop']) });
      return;
    }
    queueCtx = null; // lead-ul acesta s-a încheiat
    if (!n.lead) {
      show({
        text: `${done ? done + '. ' : ''}${n.capReached ? `Ai atins limita de azi (${n.sent}/${n.cap}). Gata pe azi.` : 'Coada e goală pentru filtrele alese.'}`,
      });
      return;
    }
    const who = n.lead.authorName || 'următoarea persoană';
    const clip = n.copied ? 'Mesajul lui e deja copiat.' : 'Nu am putut copia mesajul — îl copiezi din coadă.';
    let left = ADVANCE_SECONDS;
    const tick = () =>
      show({
        text: `${done ? done + '. ' : ''}Urmează ${who} în ${left} s. ${clip}`,
        note: `Trimise azi: ${n.sent}/${n.cap} · ${n.remaining} în coadă`,
        actions: [{ id: 'stop', label: 'Stop' }],
      });
    tick();
    clearInterval(countdownTimer);
    countdownTimer = setInterval(async () => {
      left -= 1;
      if (left > 0) return tick();
      clearInterval(countdownTimer);
      countdownTimer = null;
      if (document.hidden) {
        show({ text: `Urmează ${who}. ${clip}`, actions: [{ id: 'go', label: 'Deschide' }] });
        return;
      }
      try {
        await chrome.runtime.sendMessage({ type: 'queueGo' });
      } catch {
        /* tab-ul se reîncarcă oricum */
      }
    }, 1000);
  }

  const ACTION_LABELS = { sent: 'Am trimis', skip: 'Sari', next: 'Următorul', stop: 'Stop', retrySent: 'Reîncearcă', go: 'Deschide' };
  const queueActions = (ids) => ids.map((id) => ({ id, label: ACTION_LABELS[id] }));

  function onBannerAction(id) {
    const t = X.parseThreadUrl(location.href);
    if (!t) return;
    if (id === 'stop') {
      clearInterval(countdownTimer);
      clearInterval(sendTimer);
      countdownTimer = null;
      queueCtx = null;
      showBanner({ kind: 'done', text: 'Coada e oprită. Apasă C în /admin/leads/coada ca s-o pornești din nou.' });
      return;
    }
    if (id === 'go') {
      chrome.runtime.sendMessage({ type: 'queueGo' }).catch(() => {});
      return;
    }
    if (!fromQueue()) return;
    if (id === 'sent' || id === 'retrySent') void queueAdvance(t, 'sent');
    else if (id === 'skip') void queueAdvance(t, 'skip');
    else if (id === 'next') void queueAdvance(t, 'next');
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
    // Ai trecut singur la altă conversație în tab-ul cozii: coada nu mai acționează aici.
    if (queueThread && t.threadUrl !== queueThread) {
      queueCtx = null;
      clearInterval(sendTimer);
      clearInterval(countdownTimer);
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
      // Fără istoric (încă): dacă Messenger cere „Începe conversația”, îl apăsăm (doar în tab-ul cozii).
      maybeStartConversation(thread);
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
        showBanner({ kind: 'unknown', actions: fromQueue() ? queueActions(['sent', 'skip', 'stop']) : null });
        if (fromQueue()) queueThread = thread.threadUrl;
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
      leadId: null,
    };
    await queueReady;
    if (fromQueue()) {
      queueThread = thread.threadUrl;
      payload.leadId = queueCtx.leadId;
    }

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
    const queued = fromQueue() && !paused && !dead;
    if (queued && view.kind === 'first') {
      const started = startNotes.get(thread.threadUrl);
      view.note = [started, 'Lipește mesajul (⌘V), citește-l și apasă Enter: marchez singur și trec la următorul.', view.note]
        .filter(Boolean)
        .join(' ');
      view.actions = queueActions(['sent', 'skip', 'stop']);
    }
    // Rezultatul se reține doar dacă am primit un răspuns definitiv (ca să nu raportăm de două ori).
    if (!paused && !dead) reported.set(thread.threadUrl, { ...view, actions: null });
    if (X.parseThreadUrl(location.href)?.threadUrl === thread.threadUrl) {
      showBanner(view);
      if (view.kind === 'first') focusComposer(thread);
    }
    if (queued) {
      if (view.kind === 'first') watchSend(thread);
      else void queueAdvance(thread, 'history'); // serverul l-a marcat deja „deja contactat”
    }
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
    .done { background: #eef2ff; color: #1e3a8a; border: 1px solid #c7d2fe; font-weight: 500; }
    .acts { display: flex; gap: 6px; margin-left: 4px; }
    .act { all: unset; cursor: pointer; padding: 5px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;
           background: rgba(15,23,42,.08); white-space: nowrap; }
    .act:hover { background: rgba(15,23,42,.16); }
    .history .act { background: rgba(255,255,255,.2); }
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
        if (!e.target.closest) return;
        if (e.target.closest('.x')) hideBanner();
        const act = e.target.closest('.act');
        if (act) onBannerAction(act.dataset.act);
      });
      document.documentElement.appendChild(host);
    }
    host.style.display = '';
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    host.shadowRoot.innerHTML = `<style>${CSS}</style>
      <div class="b ${view.kind}" role="status">
        <span class="tag">Contractez</span>
        <span>${esc(view.text || TEXT[view.kind] || '')}${view.note ? `<span class="note">${esc(view.note)}</span>` : ''}</span>
        ${view.actions && view.actions.length ? `<span class="acts">${view.actions.map((a) => `<button class="act" data-act="${esc(a.id)}">${esc(a.label)}</button>`).join('')}</span>` : ''}
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
