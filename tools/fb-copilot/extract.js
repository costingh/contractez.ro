/*
 * Contractez Copilot — extract.js
 * ---------------------------------------------------------------------------
 * Singurul loc care „știe” cum arată DOM-ul Facebook. Când Facebook schimbă
 * structura paginii, AICI se repară (vezi README → „Când Facebook schimbă DOM-ul”).
 *
 * Organizare:
 *   1. SEL  — selectorii CSS (prima secțiune de editat când se strică ceva).
 *   2. Tipare de text (RO + EN): timp relativ, „Vezi mai mult”, anonimi, comentarii.
 *   3. Helperi PURI (fără DOM) — URL → id-uri, curățare text, detecție anonimi.
 *      Sunt testați în test/extract.test.mjs cu `node --test`.
 *   4. buildItem(snapshot) — PUR: dintr-un „instantaneu” al unui articol
 *      (linkuri, texte, aria-label) construiește itemul din contractul
 *      docs/OUTREACH.md sau motivul pentru care e sărit. Tot testabil în Node.
 *   5. Stratul DOM — transformă un element [role="article"] în instantaneu.
 *      Doar CITEȘTE din DOM. Nu dă click, nu modifică nimic.
 *
 * Fișierul e un script clasic (fără module), încărcat în content scripts înainte
 * de content-group.js / content-messenger.js; expune `globalThis.ContractezExtract`.
 */
(function (root) {
  'use strict';

  /* ======================================================================== */
  /* 1. SELECTORI                                                              */
  /* ======================================================================== */

  const SEL = {
    /** Zonele în care căutăm postări/comentarii. */
    roots: '[role="feed"], [role="dialog"]',
    /** Pe pagina unei singure postări (permalink) nu există feed. */
    mainRoot: '[role="main"]',
    /** Candidați pentru postări și comentarii. Postările din feed au uneori doar aria-posinset. */
    article: '[role="article"], [aria-posinset]',
    /** Containerul textului unei postări (atributele „ad preview” sunt folosite și pentru postări normale). */
    message:
      '[data-ad-preview="message"], [data-ad-comet-preview="message"], [data-ad-rendering-role="story_message"]',
    /** Zona cu numele autorului din antetul postării. */
    heading: '[data-ad-rendering-role="profile_name"], h2, h3, h4',
    /** Blocuri de text generice (fallback când lipsește containerul de mesaj). */
    autoText: 'div[dir="auto"], span[dir="auto"]',
    /** Elemente interactive al căror text NU face parte din conținut. */
    button: '[role="button"], button',
    /** Texte scurte unde apar „18 h” sau „77 de comentarii”. */
    smallText: 'span, a, abbr',
  };

  const FB_HOSTS = new Set(['www.facebook.com', 'facebook.com', 'web.facebook.com', 'm.facebook.com']);

  /** Primul segment de cale care NU e un profil (rute Facebook). Ex.: facebook.com/watch, /hashtag/… */
  const RESERVED_PATHS = new Set([
    'groups', 'pages', 'people', 'profile.php', 'hashtag', 'events', 'watch', 'reel', 'reels', 'stories',
    'marketplace', 'gaming', 'games', 'friends', 'messages', 'notifications', 'bookmarks', 'saved', 'settings',
    'help', 'policies', 'privacy', 'legal', 'login', 'logout', 'search', 'ads', 'ad_center', 'business',
    'fundraisers', 'memories', 'onthisday', 'live', 'media', 'share', 'sharer', 'sharer.php', 'dialog', 'l.php',
    'home.php', 'photo', 'photo.php', 'photos', 'videos', 'video', 'permalink.php', 'story.php', 'plugins',
    'careers', 'about', 'places', 'jobs', 'offers', 'weather', 'community', 'commerce', 'feeds', 'latest', 'me',
    'messenger', 'instantgames', 'pages_manager', 'composer', 'checkpoint', 'recover', 'reg', 'r.php', 'ufi',
    'shops', 'business_help', 'coronavirus_info', 'climatescienceinfo', 'votinginformationcenter', 'lists',
  ]);

  /** Segmente după /groups/ care NU sunt un grup anume. */
  const RESERVED_GROUP_SEGMENTS = new Set([
    'feed', 'discover', 'joins', 'notifications', 'create', 'search', 'your_groups', 'learn', 'category', 'sitemap',
  ]);

  /* ======================================================================== */
  /* 2. TIPARE DE TEXT                                                         */
  /* ======================================================================== */

  const RE = {
    /** aria-label pe comentarii: „Comment by Ion Popescu 2 hours ago”, „Comentariu de la Ion Popescu acum 2 ore”. */
    commentLabel: /^(?:comment|reply)\s+by\s+|^(?:comentariu|r[aă]spuns)(?:\s+de\s+la|\s+scris\s+de|\s+al\s+lui)?\s+/i,
    /** Anonimi în grupuri. Comparăm după eliminarea diacriticelor. */
    anonymous: /^\s*(?:anonim|anonymous|participant anonim|membru anonim|anonymous participant|anonymous member)\b/i,
    /** „Vezi mai mult” / „See more” rămas la final de text trunchiat. */
    seeMore: /\s*(?:…|\.{3})?\s*(?:see more|vezi mai mult|afi[sș]eaz[aă] mai mult)\s*$/i,
    /** Număr de comentarii: „77 comments”, „77 de comentarii”, „1 comentariu”, „1,2K comments”. */
    commentCount: /(\d[\d.,]*)\s*([km])?\s+(?:de\s+)?(?:comments?|comentarii|comentariu)\b/i,
    numericId: /^\d{3,25}$/,
    pfbid: /^pfbid[0-9A-Za-z]{10,}$/,
    username: /^[A-Za-z0-9.]{5,80}$/,
  };

  const MONTHS =
    'ian(?:uarie)?|feb(?:ruarie)?|mar(?:tie)?|apr(?:ilie)?|mai|iun(?:ie)?|iul(?:ie)?|aug(?:ust)?|sep(?:t(?:embrie)?)?|oct(?:ombrie)?|noi(?:embrie)?|dec(?:embrie)?' +
    '|jan(?:uary)?|february|march|april|may|june?|july?|august|september|october|nov(?:ember)?|december';

  const TIME_PATTERNS = [
    // Forme scurte: „18h”, „2 h”, „3 z”, „1 săpt.”, „5 min”, „1 an”, „2y”, „3w”
    /^\d{1,3}\s*(?:s|m|h|d|w|y|min|mins|hr|hrs|ore?|z|zile|zi|s[aă]pt\.?|l|luni|ani?|sec)\.?$/i,
    // „18 hours ago”, „a day ago”
    /^(?:\d{1,3}|an?|one)\s+(?:seconds?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?)(?:\s+ago)?$/i,
    // „acum 2 ore”, „2 ore”, „acum o zi”, „acum 3 săptămâni”
    /^(?:acum\s+)?(?:\d{1,3}|o|un|una)\s+(?:secunde?|minute?|minut|ore|or[aă]|zile|zi|s[aă]pt[aă]m[aâ]ni|s[aă]pt[aă]m[aâ]n[aă]|luni|lun[aă]|ani|an)$/i,
    /^(?:just now|chiar acum|acum|yesterday|today|ieri|azi|astăzi|astazi)(?:\s+(?:at|la)\s+\d{1,2}[:.]\d{2}(?:\s*[ap]m)?)?$/i,
    // „18 octombrie”, „18 octombrie 2025 la 14:05”, „October 18 at 2:05 PM”
    new RegExp('^\\d{1,2}\\s+(?:' + MONTHS + ')\\.?(?:\\s+\\d{4})?(?:\\s+(?:la|at)\\s+\\d{1,2}[:.]\\d{2}(?:\\s*[ap]m)?)?$', 'i'),
    new RegExp('^(?:' + MONTHS + ')\\.?\\s+\\d{1,2}(?:,?\\s+\\d{4})?(?:\\s+(?:la|at)\\s+\\d{1,2}[:.]\\d{2}(?:\\s*[ap]m)?)?$', 'i'),
  ];

  /** Texte de interfață (butoane, etichete) care nu sunt conținut. Comparăm lowercase, fără diacritice. */
  const UI_NOISE = new Set([
    'like', 'reply', 'share', 'comment', 'send', 'follow', 'join', 'edited', 'author', 'admin', 'moderator',
    'top contributor', 'rising contributor', 'see translation', 'see original', 'hide', 'most relevant', 'all comments',
    'write a comment', 'write a comment...', 'write a public comment', 'view more comments', 'see more', 'translate',
    'apreciez', 'imi place', 'raspunde', 'distribuie', 'comenteaza', 'comentariu', 'trimite', 'urmareste',
    'alatura-te', 'editat', 'autor', 'administrator', 'contributor de top', 'contributor in crestere',
    'vezi traducerea', 'vezi originalul', 'ascunde', 'cele mai relevante', 'toate comentariile', 'scrie un comentariu',
    'scrie un comentariu...', 'scrie un comentariu public', 'vezi mai multe comentarii', 'vezi mai mult',
    'traducere', 'membru nou', 'new member', 'fan de top', 'top fan', '·', '•',
  ]);

  /* ======================================================================== */
  /* 3. HELPERI PURI                                                           */
  /* ======================================================================== */

  function stripDiacritics(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /** Parsează un href (absolut sau relativ) doar dacă e pe facebook.com. */
  function toFbUrl(href) {
    if (!href || typeof href !== 'string') return null;
    const h = href.trim();
    if (!h || h === '#' || /^(?:javascript|mailto|tel):/i.test(h)) return null;
    try {
      const u = new URL(h, 'https://www.facebook.com/');
      return FB_HOSTS.has(u.hostname.toLowerCase()) ? u : null;
    } catch (_) {
      return null;
    }
  }

  function pathSegments(u) {
    return u.pathname
      .split('/')
      .filter(Boolean)
      .map((s) => {
        try {
          return decodeURIComponent(s);
        } catch (_) {
          return s;
        }
      });
  }

  function isPostIdLike(id) {
    return Boolean(id) && (RE.numericId.test(id) || RE.pfbid.test(id));
  }

  /**
   * Curăță textul: elimină caractere invizibile, comprimă spațiile pe fiecare rând,
   * păstrează un singur \n între paragrafe.
   */
  function cleanText(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t\f\v]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  /** Scoate „… Vezi mai mult” de la final. `truncated` = textul pare tăiat de Facebook. */
  function stripSeeMore(text) {
    const t = cleanText(text);
    if (RE.seeMore.test(t)) {
      return { text: t.replace(RE.seeMore, '').replace(/[\s…]+$/, '').trim(), truncated: true };
    }
    return { text: t, truncated: false };
  }

  function isAnonymousName(name) {
    if (!name) return false;
    return RE.anonymous.test(stripDiacritics(cleanText(name)));
  }

  function looksLikeRelativeTime(s) {
    const t = cleanText(s).replace(/\s+/g, ' ');
    if (!t || t.length > 40) return false;
    return TIME_PATTERNS.some((re) => re.test(t));
  }

  /** „77 de comentarii” → 77; „1,2K comments” → 1200. */
  function parseCommentCount(s) {
    const m = RE.commentCount.exec(cleanText(s));
    if (!m) return null;
    let raw = m[1];
    const mult = m[2] ? (m[2].toLowerCase() === 'k' ? 1000 : 1000000) : 1;
    if (mult > 1) raw = raw.replace(',', '.');
    else raw = raw.replace(/[.,]/g, '');
    const n = Math.round(parseFloat(raw) * mult);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  function isUiNoise(text) {
    const t = stripDiacritics(cleanText(text)).toLowerCase();
    if (!t) return true;
    if (UI_NOISE.has(t)) return true;
    if (looksLikeRelativeTime(t)) return true;
    if (parseCommentCount(t) !== null && t.length < 40) return true;
    if (/^\d+$/.test(t)) return true; // număr de reacții
    return false;
  }

  /**
   * Context din URL-ul paginii de grup.
   * `/groups/<gid>/`, `/groups/<gid>/posts/<id>/`, `/groups/<gid>/permalink/<id>/`,
   * `/groups/<gid>/?multi_permalinks=<id>`, `/groups/<gid>/user/<uid>/`.
   * @returns {{groupId: string, postId: string|null, memberId: string|null} | null}
   */
  function parseGroupUrl(href) {
    const u = toFbUrl(href);
    if (!u) return null;
    const seg = pathSegments(u);
    if (seg[0] !== 'groups' || !seg[1] || RESERVED_GROUP_SEGMENTS.has(seg[1].toLowerCase())) return null;
    const groupId = seg[1];
    let postId = null;
    if ((seg[2] === 'posts' || seg[2] === 'permalink') && isPostIdLike(seg[3])) postId = seg[3];
    if (!postId) {
      const mp = (u.searchParams.get('multi_permalinks') || '').split(',')[0];
      if (isPostIdLike(mp)) postId = mp;
    }
    if (!postId && u.searchParams.get('view') === 'permalink' && isPostIdLike(u.searchParams.get('id'))) {
      postId = u.searchParams.get('id');
    }
    const memberId = seg[2] === 'user' && RE.numericId.test(seg[3] || '') ? seg[3] : null;
    return { groupId, postId, memberId };
  }

  /**
   * ID-ul unei postări dintr-un link (de obicei linkul de pe timestamp).
   * Surse, în ordinea încrederii:
   *   group: /groups/<gid>/posts/<id>/ sau /groups/<gid>/permalink/<id>/
   *   gm:    ...?set=gm.<id>  (linkurile pozelor dintr-o postare de grup)
   *   story: /permalink.php?story_fbid=<id> sau /story.php?story_fbid=<id>
   *   other: /<cineva>/posts/<id|pfbid…>
   * @returns {{postId: string, groupId: string|null, source: string, hasComment: boolean} | null}
   */
  function parsePostLink(href) {
    const u = toFbUrl(href);
    if (!u) return null;
    const seg = pathSegments(u);
    const hasComment = u.searchParams.has('comment_id');
    if (seg[0] === 'groups' && seg[1] && !RESERVED_GROUP_SEGMENTS.has(seg[1].toLowerCase())) {
      if ((seg[2] === 'posts' || seg[2] === 'permalink') && isPostIdLike(seg[3])) {
        return { postId: seg[3], groupId: seg[1], source: 'group', hasComment };
      }
      const mp = (u.searchParams.get('multi_permalinks') || '').split(',')[0];
      if (isPostIdLike(mp)) return { postId: mp, groupId: seg[1], source: 'group', hasComment };
    }
    const set = u.searchParams.get('set') || '';
    const gm = /^gm\.(\d{3,25})$/.exec(set);
    if (gm) return { postId: gm[1], groupId: null, source: 'gm', hasComment };
    if (seg[0] === 'permalink.php' || seg[0] === 'story.php') {
      const id = u.searchParams.get('story_fbid');
      if (isPostIdLike(id)) return { postId: id, groupId: null, source: 'story', hasComment };
    }
    const pi = seg.indexOf('posts');
    if (pi >= 1 && isPostIdLike(seg[pi + 1])) {
      return { postId: seg[pi + 1], groupId: null, source: 'other', hasComment };
    }
    return null;
  }

  /**
   * `comment_id` e de obicei numeric; uneori e base64 din „comment:<postId>_<commentId>”.
   */
  function decodeCommentId(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    if (RE.numericId.test(s)) return s;
    try {
      const atobFn = root.atob || (typeof atob === 'function' ? atob : null);
      if (!atobFn) return null;
      const decoded = atobFn(s.replace(/-/g, '+').replace(/_/g, '/'));
      const m = /^comment:(?:\d+_)?(\d{3,25})$/.exec(decoded);
      return m ? m[1] : null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Linkul de pe timestamp-ul unui comentariu:
   *   /groups/<gid>/posts/<postId>/?comment_id=<cid>[&reply_comment_id=<rid>]
   * @returns {{commentId: string, replyCommentId: string|null, postId: string|null, groupId: string|null} | null}
   */
  function parseCommentLink(href) {
    const u = toFbUrl(href);
    if (!u) return null;
    const commentId = decodeCommentId(u.searchParams.get('comment_id'));
    if (!commentId) return null;
    const replyCommentId = decodeCommentId(u.searchParams.get('reply_comment_id'));
    const post = parsePostLink(u.href);
    return {
      commentId,
      replyCommentId,
      postId: post ? post.postId : null,
      groupId: post ? post.groupId : null,
    };
  }

  /**
   * Normalizează un link de profil. Respinge grupul în sine, hashtag-uri, pagini, rute Facebook.
   *   /groups/<gid>/user/<uid>/  → fbId=uid
   *   /profile.php?id=<id>       → fbId=id
   *   /people/<Nume>/<id>/       → fbId=id
   *   /<username>                → username
   * @returns {{profileUrl: string, fbId: string|null, username: string|null, key: string} | null}
   */
  function parseProfileUrl(href) {
    const u = toFbUrl(href);
    if (!u) return null;
    const seg = pathSegments(u);
    if (!seg.length) return null;
    const first = seg[0].toLowerCase();

    if (first === 'groups') {
      if (seg[2] === 'user' && RE.numericId.test(seg[3] || '') && seg.length <= 4) {
        const fbId = seg[3];
        return {
          profileUrl: 'https://www.facebook.com/groups/' + encodeURIComponent(seg[1]) + '/user/' + fbId + '/',
          fbId,
          username: null,
          key: 'id:' + fbId,
        };
      }
      return null;
    }
    if (first === 'profile.php') {
      const id = (u.searchParams.get('id') || '').trim();
      if (!RE.numericId.test(id)) return null;
      // profile.php?id=X&sk=photos etc. sunt tot profilul, dar linkurile cu story_fbid nu.
      if (u.searchParams.has('story_fbid')) return null;
      return { profileUrl: 'https://www.facebook.com/profile.php?id=' + id, fbId: id, username: null, key: 'id:' + id };
    }
    if (first === 'people') {
      const id = seg.find((s) => RE.numericId.test(s));
      if (!id || seg.length > 3) return null;
      return {
        profileUrl: 'https://www.facebook.com/people/' + seg.slice(1).map(encodeURIComponent).join('/') + '/',
        fbId: id,
        username: null,
        key: 'id:' + id,
      };
    }
    if (RESERVED_PATHS.has(first) || first.includes('.php')) return null;
    // Profil „vanity”: exact un segment. /<username>/posts/… e o postare, nu un profil.
    if (seg.length !== 1) return null;
    if (RE.numericId.test(seg[0])) {
      return { profileUrl: 'https://www.facebook.com/' + seg[0], fbId: seg[0], username: null, key: 'id:' + seg[0] };
    }
    if (!RE.username.test(seg[0])) return null;
    const username = seg[0].toLowerCase();
    return { profileUrl: 'https://www.facebook.com/' + seg[0], fbId: null, username, key: 'u:' + username };
  }

  /**
   * aria-label pe articolele de comentariu → nume + timp.
   * „Comment by Ion Popescu 2 hours ago” → {name: "Ion Popescu", timeText: "2 hours ago"}
   */
  function parseArticleLabel(label) {
    const l = cleanText(label);
    if (!l || !RE.commentLabel.test(l)) return null;
    const rest = l.replace(RE.commentLabel, '');
    const tokens = rest.split(' ');
    let cut = tokens.length;
    for (let i = 1; i < tokens.length; i++) {
      if (/^\d/.test(tokens[i]) || /^(?:acum|ieri|yesterday|just|today|azi|a|an|o)$/i.test(tokens[i])) {
        if (looksLikeRelativeTime(tokens.slice(i).join(' ')) || /^\d/.test(tokens[i])) {
          cut = i;
          break;
        }
      }
    }
    const name = tokens.slice(0, cut).join(' ').trim();
    const timeText = tokens.slice(cut).join(' ').trim() || null;
    return { name: name || null, timeText };
  }

  /** Thread Messenger: /messages/t/<id>/ sau /messages/e2ee/t/<id>/ */
  function parseThreadUrl(href) {
    const u = toFbUrl(href);
    if (!u) return null;
    const m = /^\/messages\/(e2ee\/)?t\/([^/?#]+)/.exec(u.pathname);
    if (!m) return null;
    let id = m[2];
    try {
      id = decodeURIComponent(id);
    } catch (_) {
      /* lăsăm brut */
    }
    if (!/^[0-9A-Za-z._-]{1,80}$/.test(id)) return null;
    const e2ee = Boolean(m[1]);
    return {
      threadId: id,
      e2ee,
      threadUrl: 'https://www.facebook.com/messages/' + (e2ee ? 'e2ee/' : '') + 't/' + id,
    };
  }

  /** document.title → numele grupului: „(3) Freelancer Romania | Facebook” → „Freelancer Romania”. */
  function cleanGroupTitle(title) {
    const t = cleanText(title)
      .replace(/^\(\d+\+?\)\s*/, '')
      .replace(/\s*[|\-–]\s*Facebook\s*$/i, '')
      .trim();
    return t && !/^facebook$/i.test(t) ? t : null;
  }

  /** Permalink canonic: fără parametri de tracking (__cft__, __tn__, …). */
  function canonicalPermalink(href) {
    const u = toFbUrl(href);
    if (!u) return null;
    const keep = ['comment_id', 'reply_comment_id', 'story_fbid', 'id', 'set', 'fbid', 'multi_permalinks'];
    const out = new URL('https://www.facebook.com' + u.pathname);
    for (const k of keep) {
      const v = u.searchParams.get(k);
      if (v) out.searchParams.set(k, v);
    }
    return out.href;
  }

  /* ======================================================================== */
  /* 4. buildItem(snapshot) — PUR                                              */
  /* ======================================================================== */

  /**
   * Instantaneu (produs de snapshotArticle în browser sau scris de mână în teste):
   * {
   *   kindHint: 'post'|'comment'|null,
   *   ariaLabel: string|null,
   *   links: [{href, text, ariaLabel, inHeading, inMessage}]   // ordinea din DOM, fără articolele imbricate
   *   headingTexts: string[],    // textele din antet (numele autorului)
   *   messageTexts: string[],    // din [data-ad-preview="message"] etc.
   *   autoTexts: string[],       // blocuri div/span[dir=auto] (fallback)
   *   smallTexts: string[],      // texte scurte (timp, nr. comentarii)
   *   hasSeeMore: boolean,       // există un buton „Vezi mai mult” în text
   *   groupAliases: string[],    // id-ul/slug-ul grupului curent
   *   pagePostId: string|null,   // id-ul postării din URL, doar pentru postarea principală a unui permalink
   *   parentPostIdHint: string|null // id-ul postării care conține comentariul (dacă se știe)
   * }
   * @returns {{item: object, anonymous: boolean, truncated: boolean, numericGroupId: string|null}
   *          | {skip: 'no-id'|'no-text'|'no-author'}}
   */
  function buildItem(snap) {
    const s = snap || {};
    const links = (s.links || []).filter((l) => l && l.href);
    const aliases = (s.groupAliases || []).filter(Boolean).map(String);
    const label = parseArticleLabel(s.ariaLabel);
    const kind = s.kindHint || (label ? 'comment' : 'post');

    // ---- ID + permalink -----------------------------------------------------
    let fbItemId = null;
    let parentPostId = null;
    let permalink = null;
    let linkGroupId = null;

    if (kind === 'comment') {
      for (const l of links) {
        if (l.inMessage) continue;
        const c = parseCommentLink(l.href);
        if (!c) continue;
        fbItemId = 'comment:' + (c.replyCommentId || c.commentId);
        const pid = c.postId || s.parentPostIdHint || null;
        parentPostId = pid ? 'post:' + pid : null;
        permalink = canonicalPermalink(l.href);
        linkGroupId = c.groupId;
        break;
      }
    } else {
      let best = null;
      let bestRank = Infinity;
      for (const l of links) {
        if (l.inMessage) continue; // un link spre altă postare lipit în text nu e postarea noastră
        const p = parsePostLink(l.href);
        if (!p) continue;
        const r = rankPostLink(p, aliases);
        if (r < bestRank) {
          best = { p, l };
          bestRank = r;
        }
      }
      if (best) {
        fbItemId = 'post:' + best.p.postId;
        linkGroupId = best.p.groupId;
        permalink =
          best.p.source === 'group'
            ? 'https://www.facebook.com/groups/' + encodeURIComponent(best.p.groupId) + '/posts/' + best.p.postId + '/'
            : canonicalPermalink(best.l.href);
      } else if (isPostIdLike(s.pagePostId)) {
        fbItemId = 'post:' + s.pagePostId;
        const gid = aliases[0];
        permalink = gid ? 'https://www.facebook.com/groups/' + encodeURIComponent(gid) + '/posts/' + s.pagePostId + '/' : null;
      }
    }
    if (!fbItemId) return { skip: 'no-id' };

    // ---- Autor --------------------------------------------------------------
    const headingName = (s.headingTexts || []).map(cleanText).find(Boolean) || null;
    let anonymous = isAnonymousName(headingName) || Boolean(label && isAnonymousName(label.name));
    let authorName = null;
    let authorProfileUrl = null;
    let authorFbId = null;

    if (!anonymous) {
      const profiles = [];
      for (const l of links) {
        if (l.inMessage) continue; // mențiunile din text nu sunt autorul
        const p = parseProfileUrl(l.href);
        if (p) profiles.push({ l, p });
      }
      const pick = profiles.find((x) => x.l.inHeading) || profiles[0];
      if (pick) {
        authorProfileUrl = pick.p.profileUrl;
        authorFbId = pick.p.fbId;
        const same = profiles.filter((x) => x.p.key === pick.p.key);
        const fromText = same.map((x) => cleanText(x.l.text)).find((t) => t && !isUiNoise(t));
        const fromAria = same.map((x) => cleanText(x.l.ariaLabel)).find((t) => t && !isUiNoise(t));
        authorName = fromText || fromAria || headingName || (label && label.name) || null;
      } else {
        authorName = headingName || (label && label.name) || null;
      }
      if (isAnonymousName(authorName)) anonymous = true;
    }
    if (anonymous) {
      authorName = headingName || (label && label.name) || authorName || 'Anonim';
      authorProfileUrl = null;
      authorFbId = null;
    } else if (!authorProfileUrl) {
      // NU trimitem: serverul l-ar marca definitiv „skipped”. Probabil selectorii sunt depășiți;
      // după reparare, itemul va fi citit corect data viitoare.
      return { skip: 'no-author' };
    }

    // ---- Text ---------------------------------------------------------------
    let parts = (s.messageTexts || []).map(cleanText).filter(Boolean);
    if (!parts.length) {
      const nameNorm = stripDiacritics(authorName || '').toLowerCase();
      parts = (s.autoTexts || [])
        .map(cleanText)
        .filter((t) => t && !isUiNoise(t) && stripDiacritics(t).toLowerCase() !== nameNorm);
    }
    parts = dedupeContained(parts);
    const stripped = stripSeeMore(parts.join('\n'));
    const text = stripped.text.slice(0, 5000);
    const truncated = stripped.truncated || Boolean(s.hasSeeMore);
    if (!text) return { skip: 'no-text' };

    // ---- Timp & comentarii ---------------------------------------------------
    let postedAtText = label && label.timeText && looksLikeRelativeTime(label.timeText) ? label.timeText : null;
    if (!postedAtText) {
      for (const l of links) {
        if (l.inMessage) continue;
        const cand = [cleanText(l.text), cleanText(l.ariaLabel)].find((t) => t && looksLikeRelativeTime(t));
        if (cand) {
          postedAtText = cand;
          break;
        }
      }
    }
    if (!postedAtText) postedAtText = (s.smallTexts || []).map(cleanText).find(looksLikeRelativeTime) || null;

    let commentCount = null;
    if (kind === 'post') {
      for (const t of s.smallTexts || []) {
        const n = parseCommentCount(t);
        if (n !== null) {
          commentCount = n;
          break;
        }
      }
    }

    const numericGroupId = linkGroupId && RE.numericId.test(linkGroupId) ? linkGroupId : null;

    return {
      item: {
        fbItemId,
        kind,
        parentPostId: kind === 'comment' ? parentPostId : null,
        authorName: authorName ? authorName.slice(0, 200) : null,
        authorProfileUrl,
        authorFbId,
        text,
        permalink,
        postedAtText: postedAtText ? postedAtText.slice(0, 100) : null,
        commentCount,
      },
      anonymous,
      truncated,
      numericGroupId,
    };
  }

  /**
   * Cât de sigur e că linkul e permalinkul postării curente (mai mic = mai sigur).
   * Linkurile spre alt grup sunt, de regulă, conținut distribuit → ignorate.
   */
  function rankPostLink(p, aliases) {
    let r;
    if (p.source === 'group') {
      if (!aliases.length || aliases.includes(p.groupId)) r = 0;
      else if (RE.numericId.test(p.groupId) && !aliases.some((a) => RE.numericId.test(a))) r = 1; // slug în URL, id numeric în link
      else return Infinity; // alt grup → conținut distribuit
    } else if (p.source === 'gm') r = 2;
    else if (p.source === 'story') r = 3;
    else r = 4;
    if (p.hasComment) r += 0.5;
    if (!RE.numericId.test(p.postId)) r += 0.25; // preferăm id-ul numeric în locul pfbid…
    return r;
  }

  /** Elimină fragmentele conținute integral în alt fragment (div-uri imbricate). */
  function dedupeContained(parts) {
    const out = [];
    for (const p of parts) {
      if (out.some((o) => o.includes(p))) continue;
      for (let i = out.length - 1; i >= 0; i--) if (p.includes(out[i])) out.splice(i, 1);
      out.push(p);
    }
    return out;
  }

  /* ======================================================================== */
  /* 5. STRATUL DOM (doar citire)                                              */
  /* ======================================================================== */

  /** E articolul un comentariu? aria-label e cel mai sigur semnal; fallback: imbricat + link cu comment_id. */
  function isCommentElement(el) {
    if (parseArticleLabel(el.getAttribute('aria-label'))) return true;
    if (el.querySelector(SEL.message)) return false;
    const parent = el.parentElement && el.parentElement.closest(SEL.article);
    if (!parent) return false;
    // Postările au antet cu h2/h3/h4 (numele autorului); comentariile nu.
    if (el.querySelector('h2, h3, h4')) return false;
    return el.querySelector('a[href*="comment_id="]') !== null;
  }

  /**
   * Toate articolele din rădăcinile date. Postările duplicate (aria-posinset + role=article
   * pe același conținut) sunt reduse la cel mai exterior element.
   * @returns {{el: Element, kind: 'post'|'comment'}[]}
   */
  function findArticles(rootEls) {
    const seen = new Set();
    const out = [];
    for (const r of rootEls) {
      if (!r) continue;
      const list = r.matches && r.matches(SEL.article) ? [r, ...r.querySelectorAll(SEL.article)] : r.querySelectorAll(SEL.article);
      for (const el of list) {
        if (seen.has(el)) continue;
        seen.add(el);
        const kind = isCommentElement(el) ? 'comment' : 'post';
        if (kind === 'post') {
          // Un „post” imbricat într-un alt post (fără a fi comentariu) e același post la alt nivel.
          const outer = el.parentElement && el.parentElement.closest(SEL.article);
          if (outer && !isCommentElement(outer)) continue;
        }
        out.push({ el, kind });
      }
    }
    return out;
  }

  /** Nodul aparține unui articol de comentariu imbricat (deci nu articolului `root`)? */
  function insideNested(node, rootEl, nested) {
    for (const n of nested) if (n !== rootEl && n.contains(node)) return true;
    return false;
  }

  /**
   * Citește un articol într-un instantaneu pentru buildItem. Nu modifică DOM-ul.
   * @param {Element} el
   * @param {{kind: string, groupAliases: string[], pagePostId?: string|null, parentPostIdHint?: string|null}} ctx
   */
  function snapshotArticle(el, ctx) {
    // Excludem doar comentariile imbricate (răspunsuri / comentariile unei postări), nu și
    // un role="article" interior care e aceeași postare (cazul aria-posinset + role=article).
    const nested = Array.from(el.querySelectorAll(SEL.article)).filter((n) => n !== el && isCommentElement(n));
    const own = (n) => !insideNested(n, el, nested);
    const messageEls = Array.from(el.querySelectorAll(SEL.message)).filter(own);
    const inMessage = (n) => messageEls.some((m) => m.contains(n));
    const headingEls = Array.from(el.querySelectorAll(SEL.heading)).filter(own).filter((h) => !inMessage(h));
    const inHeading = (n) => headingEls.some((h) => h.contains(n));

    const links = [];
    for (const a of el.querySelectorAll('a[href]')) {
      if (!own(a)) continue;
      links.push({
        href: a.href || a.getAttribute('href'),
        text: a.textContent || '',
        ariaLabel: a.getAttribute('aria-label'),
        inHeading: inHeading(a),
        inMessage: inMessage(a),
      });
      if (links.length > 80) break;
    }

    const textOf = (n) => (n.innerText !== undefined && n.innerText !== '' ? n.innerText : n.textContent) || '';
    const messageTexts = messageEls.filter((m) => !messageEls.some((o) => o !== m && o.contains(m))).map(textOf);

    // „Vezi mai mult” e un buton în interiorul textului; NU îl apăsăm, doar notăm că textul e trunchiat.
    let hasSeeMore = false;
    const seeMoreScope = messageEls.length ? messageEls : [el];
    for (const scope of seeMoreScope) {
      for (const b of scope.querySelectorAll(SEL.button)) {
        if (own(b) && RE.seeMore.test(' ' + cleanText(b.textContent))) {
          hasSeeMore = true;
          break;
        }
      }
    }

    let autoTexts = [];
    if (!messageTexts.length) {
      const blocks = Array.from(el.querySelectorAll(SEL.autoText)).filter(
        (n) => own(n) && !n.closest('a') && !inHeading(n) && !n.closest(SEL.button),
      );
      // Doar cele mai exterioare blocuri.
      autoTexts = blocks.filter((n) => !blocks.some((o) => o !== n && o.contains(n))).map(textOf).slice(0, 20);
    }

    const smallTexts = [];
    for (const n of el.querySelectorAll(SEL.smallText)) {
      if (smallTexts.length >= 60) break;
      if (!own(n) || inMessage(n)) continue;
      const t = cleanText(n.textContent);
      if (t && t.length <= 40 && n.children.length <= 2) smallTexts.push(t);
    }

    return {
      kindHint: ctx.kind || null,
      ariaLabel: el.getAttribute('aria-label'),
      links,
      headingTexts: headingEls.map((h) => h.textContent || '').filter((t) => cleanText(t)).slice(0, 3),
      messageTexts,
      autoTexts,
      smallTexts,
      hasSeeMore,
      groupAliases: ctx.groupAliases || [],
      pagePostId: ctx.pagePostId || null,
      parentPostIdHint: ctx.parentPostIdHint || null,
    };
  }

  /** Numele grupului: titlul h1 din antet, apoi document.title. */
  function readGroupName(doc, groupId) {
    const main = doc.querySelector(SEL.mainRoot) || doc;
    const h1Link = groupId && main.querySelector('h1 a[href*="/groups/' + CSS_escape(groupId) + '"]');
    const h1 = h1Link || main.querySelector('h1');
    const name = h1 ? cleanText(h1.textContent) : '';
    if (name && name.length <= 300) return name;
    return cleanGroupTitle(doc.title);
  }

  function CSS_escape(s) {
    return String(s).replace(/["\\]/g, '\\$&');
  }

  /* ======================================================================== */
  /* Export                                                                    */
  /* ======================================================================== */

  root.ContractezExtract = {
    SEL,
    // puri
    cleanText,
    stripSeeMore,
    isAnonymousName,
    looksLikeRelativeTime,
    parseCommentCount,
    isUiNoise,
    parseGroupUrl,
    parsePostLink,
    decodeCommentId,
    parseCommentLink,
    parseProfileUrl,
    parseArticleLabel,
    parseThreadUrl,
    cleanGroupTitle,
    canonicalPermalink,
    buildItem,
    // DOM
    isCommentElement,
    findArticles,
    snapshotArticle,
    readGroupName,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
