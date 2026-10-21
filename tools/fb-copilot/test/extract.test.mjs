// Teste pentru extract.js — rulează cu:  node --test tools/fb-copilot/test/
//
// jsdom nu e în node_modules-ul proiectului, așa că testăm:
//   - helperii puri (URL → id-uri, curățare text, anonimi, timp relativ);
//   - buildItem() pe „instantanee” sintetice care imită ce citește snapshotArticle()
//     dintr-un articol Facebook real (linkuri în ordinea din DOM, antet, text).
// extract.js e un script clasic (pentru content scripts), deci îl evaluăm în contextul curent.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const file = fileURLToPath(new URL('../extract.js', import.meta.url));
vm.runInThisContext(readFileSync(file, 'utf8'), { filename: file });
const X = globalThis.ContractezExtract;

const GID = '252706105062924';
const CFT = '?__cft__[0]=AZW-abc&__tn__=%2CO%2CP-R';

/* -------------------------------------------------------------------------- */
/* Helperi puri                                                                */
/* -------------------------------------------------------------------------- */

test('parseGroupUrl: grup, postare, permalink, multi_permalinks, rute rezervate', () => {
  assert.deepEqual(X.parseGroupUrl(`https://www.facebook.com/groups/${GID}/`), { groupId: GID, postId: null, memberId: null });
  assert.equal(X.parseGroupUrl(`https://www.facebook.com/groups/${GID}/posts/1234567890/`).postId, '1234567890');
  assert.equal(X.parseGroupUrl(`https://www.facebook.com/groups/freelancerro/permalink/1234567890/`).postId, '1234567890');
  assert.equal(X.parseGroupUrl(`https://www.facebook.com/groups/${GID}/?multi_permalinks=999888777,111`).postId, '999888777');
  assert.equal(X.parseGroupUrl(`https://www.facebook.com/groups/${GID}/user/1000123/`).memberId, '1000123');
  assert.equal(X.parseGroupUrl('https://www.facebook.com/groups/feed/'), null);
  assert.equal(X.parseGroupUrl('https://www.facebook.com/groups/discover'), null);
  assert.equal(X.parseGroupUrl('https://www.facebook.com/marketplace/'), null);
  assert.equal(X.parseGroupUrl('https://evil.example.com/groups/123/'), null);
});

test('parsePostLink: toate formele de permalink', () => {
  assert.deepEqual(X.parsePostLink(`/groups/${GID}/posts/1234567890/${CFT}`), {
    postId: '1234567890', groupId: GID, source: 'group', hasComment: false,
  });
  assert.equal(X.parsePostLink(`https://www.facebook.com/groups/${GID}/permalink/555666777/`).postId, '555666777');
  assert.equal(X.parsePostLink('https://www.facebook.com/permalink.php?story_fbid=777888999&id=100064').source, 'story');
  assert.equal(X.parsePostLink('https://www.facebook.com/story.php?story_fbid=pfbid02AbCdEfGhIjKlMn&id=1').postId, 'pfbid02AbCdEfGhIjKlMn');
  assert.deepEqual(X.parsePostLink('https://www.facebook.com/photo/?fbid=1&set=gm.4444555566'), {
    postId: '4444555566', groupId: null, source: 'gm', hasComment: false,
  });
  assert.equal(X.parsePostLink('https://www.facebook.com/ion.popescu/posts/pfbid0xYz123abcDEF456').source, 'other');
  assert.equal(X.parsePostLink(`/groups/${GID}/posts/1234567890/?comment_id=42424242`).hasComment, true);
  assert.equal(X.parsePostLink(`/groups/${GID}/`), null);
  assert.equal(X.parsePostLink('#'), null);
  assert.equal(X.parsePostLink('https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com'), null);
});

test('parseCommentLink: comment_id, reply_comment_id, base64', () => {
  assert.deepEqual(X.parseCommentLink(`/groups/${GID}/posts/1234567890/?comment_id=987654321${CFT.replace('?', '&')}`), {
    commentId: '987654321', replyCommentId: null, postId: '1234567890', groupId: GID,
  });
  const r = X.parseCommentLink(`/groups/${GID}/posts/1234567890/?comment_id=987654321&reply_comment_id=555444333`);
  assert.equal(r.replyCommentId, '555444333');
  const b64 = Buffer.from('comment:1234567890_31415926535').toString('base64');
  assert.equal(X.parseCommentLink(`/groups/${GID}/posts/1234567890/?comment_id=${encodeURIComponent(b64)}`).commentId, '31415926535');
  assert.equal(X.parseCommentLink(`/groups/${GID}/posts/1234567890/`), null);
  assert.equal(X.decodeCommentId('nu-e-un-id'), null);
});

test('parseProfileUrl: profil de grup, profile.php, username; respinge grup/hashtag/pagini', () => {
  assert.deepEqual(X.parseProfileUrl(`https://www.facebook.com/groups/${GID}/user/1000123/${CFT}`), {
    profileUrl: `https://www.facebook.com/groups/${GID}/user/1000123/`, fbId: '1000123', username: null, key: 'id:1000123',
  });
  assert.deepEqual(X.parseProfileUrl('/profile.php?id=100089&__tn__=R'), {
    profileUrl: 'https://www.facebook.com/profile.php?id=100089', fbId: '100089', username: null, key: 'id:100089',
  });
  assert.equal(X.parseProfileUrl('https://www.facebook.com/Ion.Popescu.77?__cft__=x').key, 'u:ion.popescu.77');
  assert.equal(X.parseProfileUrl('https://www.facebook.com/people/Ion-Popescu/100012345678/').fbId, '100012345678');
  assert.equal(X.parseProfileUrl(`https://www.facebook.com/groups/${GID}/`), null);
  assert.equal(X.parseProfileUrl('https://www.facebook.com/hashtag/freelance'), null);
  assert.equal(X.parseProfileUrl('https://www.facebook.com/pages/Ceva/123'), null);
  assert.equal(X.parseProfileUrl('https://www.facebook.com/watch/'), null);
  assert.equal(X.parseProfileUrl('https://www.facebook.com/ion.popescu/posts/pfbid0xYz123abcDEF456'), null);
  assert.equal(X.parseProfileUrl('https://www.facebook.com/permalink.php?story_fbid=1&id=2'), null);
  assert.equal(X.parseProfileUrl('https://example.com/ion.popescu'), null);
});

test('cleanText + stripSeeMore', () => {
  assert.equal(X.cleanText('  Caut  un   designer\n\n\n  pentru logo ​ '), 'Caut un designer\npentru logo');
  assert.deepEqual(X.stripSeeMore('Caut instalator în Cluj pentru o baie… Vezi mai mult'), {
    text: 'Caut instalator în Cluj pentru o baie', truncated: true,
  });
  assert.deepEqual(X.stripSeeMore('Looking for a plumber... See more'), { text: 'Looking for a plumber', truncated: true });
  assert.equal(X.stripSeeMore('Vreau mai mult decât atât').truncated, false);
});

test('isAnonymousName', () => {
  for (const n of ['Anonim', 'Participant anonim', 'Anonymous participant', 'Membru anonim', 'Anonymous member 123']) {
    assert.equal(X.isAnonymousName(n), true, n);
  }
  for (const n of ['Ion Popescu', 'Anonimescu Vasile', '', null]) assert.equal(X.isAnonymousName(n), false, String(n));
});

test('looksLikeRelativeTime (RO + EN)', () => {
  for (const t of ['18h', '2 h', '3 z', '1 săpt.', '5 min', '18 hours ago', 'acum 2 ore', 'Ieri la 14:05', 'Yesterday at 2:05 PM',
    '18 octombrie', '18 octombrie 2025 la 14:05', 'October 18 at 2:05 PM', 'Just now', 'acum o zi']) {
    assert.equal(X.looksLikeRelativeTime(t), true, t);
  }
  for (const t of ['Ion Popescu', 'Caut 2 h de ajutor la mutat mobila', 'Like', '']) assert.equal(X.looksLikeRelativeTime(t), false, t);
});

test('parseCommentCount', () => {
  assert.equal(X.parseCommentCount('77 de comentarii'), 77);
  assert.equal(X.parseCommentCount('1 comentariu'), 1);
  assert.equal(X.parseCommentCount('12 comments'), 12);
  assert.equal(X.parseCommentCount('1,2K comments'), 1200);
  assert.equal(X.parseCommentCount('1.234 de comentarii'), 1234);
  assert.equal(X.parseCommentCount('Caut designer'), null);
});

test('parseArticleLabel: aria-label de comentariu', () => {
  assert.deepEqual(X.parseArticleLabel('Comment by Ion Popescu 2 hours ago'), { name: 'Ion Popescu', timeText: '2 hours ago' });
  assert.deepEqual(X.parseArticleLabel('Comentariu de la Maria Ionescu acum 3 zile'), { name: 'Maria Ionescu', timeText: 'acum 3 zile' });
  assert.deepEqual(X.parseArticleLabel('Reply by Anonymous participant 5h'), { name: 'Anonymous participant', timeText: '5h' });
  assert.equal(X.parseArticleLabel('Ion Popescu'), null);
  assert.equal(X.parseArticleLabel(null), null);
});

test('parseThreadUrl + cleanGroupTitle', () => {
  assert.deepEqual(X.parseThreadUrl('https://www.facebook.com/messages/t/1000123/'), {
    threadId: '1000123', e2ee: false, threadUrl: 'https://www.facebook.com/messages/t/1000123',
  });
  assert.deepEqual(X.parseThreadUrl('https://www.facebook.com/messages/e2ee/t/7123456789012345'), {
    threadId: '7123456789012345', e2ee: true, threadUrl: 'https://www.facebook.com/messages/e2ee/t/7123456789012345',
  });
  assert.equal(X.parseThreadUrl('https://www.facebook.com/messages/'), null);
  assert.equal(X.parseThreadUrl('https://www.facebook.com/groups/1/'), null);
  assert.equal(X.cleanGroupTitle('(3) Freelancer Romania - Social Media Romania | Facebook'), 'Freelancer Romania - Social Media Romania');
  assert.equal(X.cleanGroupTitle('Facebook'), null);
});

/* -------------------------------------------------------------------------- */
/* buildItem pe instantanee sintetice                                          */
/* -------------------------------------------------------------------------- */

// Echivalentul (simplificat) din DOM al unei postări din feed:
// <div aria-posinset="1">
//   <h3><a href="/groups/GID/user/1000123/?__cft__…">Ion Popescu</a></h3>
//   <a href="/groups/GID/posts/1234567890/?__cft__…">18 h</a>
//   <div data-ad-preview="message"><div dir="auto">Caut un social media manager…</div></div>
//   <span>77 de comentarii</span>
// </div>
const postSnapshot = () => ({
  kindHint: 'post',
  ariaLabel: null,
  links: [
    { href: `https://www.facebook.com/groups/${GID}/user/1000123/${CFT}`, text: '', ariaLabel: 'Ion Popescu', inHeading: false, inMessage: false },
    { href: `https://www.facebook.com/groups/${GID}/user/1000123/${CFT}`, text: 'Ion Popescu', ariaLabel: null, inHeading: true, inMessage: false },
    { href: `https://www.facebook.com/groups/${GID}/`, text: 'Freelancer Romania', ariaLabel: null, inHeading: true, inMessage: false },
    { href: `https://www.facebook.com/groups/${GID}/posts/1234567890/${CFT}`, text: '18 h', ariaLabel: null, inHeading: false, inMessage: false },
    { href: 'https://www.facebook.com/hashtag/socialmedia', text: '#socialmedia', ariaLabel: null, inHeading: false, inMessage: true },
    { href: 'https://www.facebook.com/maria.ionescu.1', text: 'Maria Ionescu', ariaLabel: null, inHeading: false, inMessage: true },
  ],
  headingTexts: ['Ion Popescu'],
  messageTexts: ['Caut un   social media manager\npentru o cafenea din Cluj. #socialmedia @Maria Ionescu'],
  autoTexts: [],
  smallTexts: ['Ion Popescu', '18 h', 'Apreciez', '77 de comentarii', '3 distribuiri'],
  hasSeeMore: false,
  groupAliases: [GID],
  pagePostId: null,
  parentPostIdHint: null,
});

test('buildItem: postare normală', () => {
  const r = X.buildItem(postSnapshot());
  assert.equal(r.skip, undefined);
  assert.deepEqual(r.item, {
    fbItemId: 'post:1234567890',
    kind: 'post',
    parentPostId: null,
    authorName: 'Ion Popescu',
    authorProfileUrl: `https://www.facebook.com/groups/${GID}/user/1000123/`,
    authorFbId: '1000123',
    text: 'Caut un social media manager\npentru o cafenea din Cluj. #socialmedia @Maria Ionescu',
    permalink: `https://www.facebook.com/groups/${GID}/posts/1234567890/`,
    postedAtText: '18 h',
    commentCount: 77,
  });
  assert.equal(r.anonymous, false);
  assert.equal(r.truncated, false);
  assert.equal(r.numericGroupId, GID);
});

test('buildItem: grup cu slug în URL învață id-ul numeric din permalink', () => {
  const s = postSnapshot();
  s.groupAliases = ['freelancerromania'];
  const r = X.buildItem(s);
  assert.equal(r.item.fbItemId, 'post:1234567890');
  assert.equal(r.numericGroupId, GID);
});

test('buildItem: ignoră permalinkul unei postări distribuite din alt grup', () => {
  const s = postSnapshot();
  s.links.splice(3, 1); // fără timestamp propriu (href încă „#” până la hover)
  s.links.push({ href: 'https://www.facebook.com/groups/999999999/posts/111222333/', text: 'Alt grup', inHeading: false, inMessage: false });
  assert.deepEqual(X.buildItem(s), { skip: 'no-id' });
  s.pagePostId = '1234567890'; // pe pagina de permalink, id-ul vine din URL
  assert.equal(X.buildItem(s).item.fbItemId, 'post:1234567890');
});

test('buildItem: text trunchiat cu „Vezi mai mult”', () => {
  const s = postSnapshot();
  s.messageTexts = ['Caut instalator pentru baie în Cluj, buget 2000 lei… Vezi mai mult'];
  const r = X.buildItem(s);
  assert.equal(r.item.text, 'Caut instalator pentru baie în Cluj, buget 2000 lei');
  assert.equal(r.truncated, true);
});

test('buildItem: postare anonimă → trimisă fără profil (serverul o marchează skipped)', () => {
  const s = postSnapshot();
  s.links = s.links.filter((l) => !l.href.includes('/user/'));
  s.headingTexts = ['Participant anonim'];
  const r = X.buildItem(s);
  assert.equal(r.anonymous, true);
  assert.equal(r.item.authorName, 'Participant anonim');
  assert.equal(r.item.authorProfileUrl, null);
  assert.equal(r.item.authorFbId, null);
});

test('buildItem: autor negăsit (DOM schimbat) → sărit pe client, nu trimis', () => {
  const s = postSnapshot();
  s.links = s.links.filter((l) => !l.href.includes('/user/'));
  assert.deepEqual(X.buildItem(s), { skip: 'no-author' });
});

test('buildItem: fără text → sărit', () => {
  const s = postSnapshot();
  s.messageTexts = [];
  s.autoTexts = ['Ion Popescu', '18 h', 'Apreciez', 'Comentează'];
  assert.deepEqual(X.buildItem(s), { skip: 'no-text' });
});

// <div role="article" aria-label="Comment by Maria Ionescu 2 hours ago">
//   <a href="/groups/GID/user/2000456/"><span dir="auto">Maria Ionescu</span></a>
//   <div dir="auto">Vă pot ajuta eu, am experiență 5 ani.</div>
//   <a href="/groups/GID/posts/1234567890/?comment_id=987654321&__cft__…">2 h</a>
//   <div role="button">Răspunde</div>
// </div>
const commentSnapshot = () => ({
  kindHint: 'comment',
  ariaLabel: 'Comment by Maria Ionescu 2 hours ago',
  links: [
    { href: `https://www.facebook.com/groups/${GID}/user/2000456/${CFT}`, text: 'Maria Ionescu', ariaLabel: null, inHeading: false, inMessage: false },
    { href: `https://www.facebook.com/groups/${GID}/posts/1234567890/?comment_id=987654321&__cft__[0]=x`, text: '2 h', ariaLabel: null, inHeading: false, inMessage: false },
  ],
  headingTexts: [],
  messageTexts: [],
  autoTexts: ['Vă pot ajuta eu,   am experiență 5 ani.', 'Răspunde', '2 h'],
  smallTexts: ['Maria Ionescu', '2 h', 'Răspunde'],
  hasSeeMore: false,
  groupAliases: [GID],
  pagePostId: null,
  parentPostIdHint: null,
});

test('buildItem: comentariu', () => {
  const r = X.buildItem(commentSnapshot());
  assert.deepEqual(r.item, {
    fbItemId: 'comment:987654321',
    kind: 'comment',
    parentPostId: 'post:1234567890',
    authorName: 'Maria Ionescu',
    authorProfileUrl: `https://www.facebook.com/groups/${GID}/user/2000456/`,
    authorFbId: '2000456',
    text: 'Vă pot ajuta eu, am experiență 5 ani.',
    permalink: `https://www.facebook.com/groups/${GID}/posts/1234567890/?comment_id=987654321`,
    postedAtText: '2 hours ago',
    commentCount: null,
  });
});

test('buildItem: răspuns la comentariu folosește reply_comment_id', () => {
  const s = commentSnapshot();
  s.ariaLabel = 'Reply by Maria Ionescu 1h';
  s.links[1].href = `https://www.facebook.com/groups/${GID}/posts/1234567890/?comment_id=987654321&reply_comment_id=111000111`;
  assert.equal(X.buildItem(s).item.fbItemId, 'comment:111000111');
});

test('buildItem: comentariu fără comment_id (link încă „#”) → sărit', () => {
  const s = commentSnapshot();
  s.links[1].href = '#';
  assert.deepEqual(X.buildItem(s), { skip: 'no-id' });
});

test('buildItem: comentariu anonim', () => {
  const s = commentSnapshot();
  s.ariaLabel = 'Comment by Anonymous participant 2 hours ago';
  s.links.shift();
  const r = X.buildItem(s);
  assert.equal(r.anonymous, true);
  assert.equal(r.item.authorProfileUrl, null);
  assert.equal(r.item.authorName, 'Anonymous participant');
});
