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
  assert.deepEqual(m.permissions, ['storage', 'scripting']);
  assert.deepEqual(m.host_permissions.sort(), ['http://localhost:3000/*', 'https://contractez.ro/*', 'https://www.facebook.com/*']);
  assert.equal(m.background.service_worker, 'background.js');
  const matches = m.content_scripts.flatMap((c) => c.matches).sort();
  // FB e SPA: scripturile se încarcă pe tot domeniul și se activează singure doar pe grupuri / conversații.
  assert.deepEqual(matches, ['https://www.facebook.com/*', 'https://www.facebook.com/*']);
  for (const cs of m.content_scripts) assert.equal(cs.js[0], 'extract.js', 'extract.js trebuie încărcat primul');
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

test('content script-urile nu dau click, nu derulează, nu navighează, nu scriu', () => {
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
  for (const f of ['extract.js', 'content-group.js', 'content-messenger.js']) {
    const src = read(f)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    for (const re of forbidden) assert.ok(!re.test(src), `${f} conține ${re}`);
  }
});
