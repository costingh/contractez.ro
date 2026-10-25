// Validează manifest.json și regulile de siguranță ale content script-urilor.
// Rulează cu:  cd tools/fb-copilot && node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(new URL('../manifest.json', import.meta.url)));
const read = (f) => readFileSync(path.join(dir, f), 'utf8');

test('manifest.json e JSON valid, MV3, cu permisiunile cerute', () => {
  const m = JSON.parse(read('manifest.json'));
  assert.equal(m.manifest_version, 3);
  assert.equal(m.name, 'Contractez Copilot');
  // scripting: injectare în tab-urile deja deschise la instalare (doar fișierele extensiei).
  // offscreen + clipboardWrite: copierea mesajului următorului lead din coadă (doar scriere în clipboard).
  assert.deepEqual(m.permissions, ['storage', 'scripting', 'offscreen', 'clipboardWrite']);
  assert.deepEqual(m.host_permissions.sort(), ['http://localhost:3000/*', 'https://contractez.ro/*', 'https://www.facebook.com/*']);
  assert.equal(m.background.service_worker, 'background.js');
  const fb = m.content_scripts.filter((c) => c.matches.includes('https://www.facebook.com/*'));
  // FB e SPA: scripturile se încarcă pe tot domeniul și se activează singure doar pe grupuri / conversații.
  assert.equal(fb.length, 2);
  for (const cs of fb) assert.equal(cs.js[0], 'extract.js', 'extract.js trebuie încărcat primul');
  // Puntea cu /admin/leads/coada (Next e SPA: se încarcă pe /admin/* și se activează doar pe coadă).
  const queue = m.content_scripts.filter((c) => !c.matches.includes('https://www.facebook.com/*'));
  assert.deepEqual(queue.map((c) => c.js), [['content-queue.js']]);
  assert.deepEqual(queue[0].matches.sort(), ['http://localhost:3000/admin/*', 'https://contractez.ro/admin/*']);
});

test('toate fișierele referite în manifest există', () => {
  const m = JSON.parse(read('manifest.json'));
  const files = [
    m.background.service_worker,
    m.action.default_popup,
    m.options_ui.page,
    ...m.content_scripts.flatMap((c) => c.js),
    ...Object.values(m.icons),
    ...Object.values(m.action.default_icon),
  ];
  for (const f of files) assert.ok(existsSync(path.join(dir, f)), `lipsește ${f}`);
});

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('content script-urile nu dau click, nu derulează, nu navighează, nu scriu', () => {
  // Excepția: content-messenger.js are exact un click() („Începe conversația”) și un focus() (câmpul de mesaj),
  // verificate în testul următor; aici le eliminăm ca să rămână interzise oriunde altundeva.
  const allowed = { 'content-messenger.js': [/found\.el\.click\(\);/, /box\.focus\(\);/] };
  const forbidden = [
    /\.click\s*\(/,
    /dispatchEvent\s*\(/,
    /new\s+(?:Mouse|Keyboard|Pointer|Input)Event/,
    /scroll(?:To|By|IntoView)\s*\(/,
    /\.scrollTop\s*=/,
    /execCommand\s*\(/,
    /location\.(?:assign|replace|reload)\s*\(/,
    /location\.href\s*=[^=]/,
    /window\.open\s*\(/,
    /\.focus\s*\(/,
    /\.submit\s*\(/,
  ];
  for (const f of ['extract.js', 'content-group.js', 'content-messenger.js', 'content-queue.js']) {
    let src = stripComments(read(f));
    for (const re of allowed[f] ?? []) src = src.replace(re, '');
    for (const re of forbidden) assert.ok(!re.test(src), `${f} conține ${re}`);
  }
  // În Messenger nu scriem nimic în pagină (bannerul e în shadow DOM-ul propriu, setat prin innerHTML).
  const msg = stripComments(read('content-messenger.js'));
  assert.ok(!/insertText|ClipboardEvent|clipboard\.|\.(?:textContent|innerText|value)\s*=[^=]/.test(msg), 'content-messenger.js scrie în pagină');
});

test('Messenger: un singur click, doar pe „Începe conversația”, doar în tab-ul cozii', () => {
  const src = stripComments(read('content-messenger.js'));
  assert.equal(src.match(/\.click\s*\(/g)?.length, 1);
  assert.equal(src.match(/\.focus\s*\(/g)?.length, 1);
  // „Tab-ul cozii” îl decide service worker-ul (după id-ul tab-ului pe care l-a deschis), nu pagina.
  assert.match(src, /const fromQueue = \(\) => Boolean\(queueCtx\);/);
  assert.match(src, /sendMessage\(\{ type: 'queueContext' \}\)/);
  const fn = (name) => src.slice(src.indexOf(`function ${name}(`), src.indexOf('\n  }\n', src.indexOf(`function ${name}(`)));
  for (const name of ['maybeStartConversation', 'focusComposer']) {
    assert.match(fn(name), /if \(!fromQueue\(\) \|\| document\.hidden \|\| /, `${name} trebuie limitat la tab-ul cozii, vizibil`);
  }

  // Etichetele: doar pornirea conversației, niciodată trimiterea.
  const start = new RegExp(src.match(/const START_LABEL = \/(.+)\/i;/)[1], 'i');
  const never = new RegExp(src.match(/const NEVER_LABEL = \/(.+)\/i;/)[1], 'i');
  for (const ok of ['Începe conversația', 'Incepe conversatia', 'Start conversation', 'Start a chat', 'Continuă', 'Continue']) {
    assert.ok(start.test(ok) && !never.test(ok), ok);
  }
  for (const no of ['Trimite', 'Send', 'Trimite mesajul', 'Apel audio', 'Blochează', 'Continuă să trimiți', 'Șterge conversația']) {
    assert.ok(!start.test(no) || never.test(no), no);
  }
});

test('service worker: mută doar tab-ul cozii și doar pe linkuri Messenger generate de server', () => {
  const src = stripComments(read('background.js'));
  const open = src.slice(src.indexOf('async function openInQueueTab('), src.indexOf('\n}\n', src.indexOf('async function openInQueueTab(')));
  assert.match(open, /if \(!QUEUE_THREAD_URL\.test\(url\)\) return/);
  assert.equal(src.match(/chrome\.tabs\.(?:update|create)\(/g)?.length, 2, 'tabs.update/create doar în openInQueueTab');
  assert.ok(open.includes('chrome.tabs.update(') && open.includes('chrome.tabs.create('));
  for (const t of ['queueSent', 'queueSkip', 'queueNext', 'queueGo', 'queueContext']) {
    const i = src.indexOf(`case '${t}'`);
    assert.ok(i > 0, t);
    assert.match(src.slice(i, i + 400), /st\.tabId !== sender\.tab\.id/, `${t} trebuie limitat la tab-ul cozii`);
  }
  const re = new RegExp(src.match(/const QUEUE_THREAD_URL = \/(.+)\/;/)[1]);
  assert.ok(re.test('https://www.facebook.com/messages/t/100012345'));
  assert.ok(!re.test('https://www.facebook.com/messages/t/1/?send=1') && !re.test('https://evil.com/messages/t/1'));
});
