// kit.css（あみだくじのページだけが読む）に、当たらない規則を残さないためのテスト（Q-718・D579）: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
// 広告の script（外から読む）が作る要素。手元の html・js には字が無い
const EXTERNAL = new Set(['adsbygoogle', 'google-auto-placed']);

function htmlFiles(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ['.git', 'node_modules', 'tests', 'tools'].includes(e.name) ? [] : htmlFiles(p);
    return e.name.endsWith('.html') ? [p] : [];
  });
}

test('kit.css を読むのは amida/index.html と amida/guide.html の 2 枚だけ', () => {
  const readers = htmlFiles('.').filter((f) => /href="[^"]*kit\.css"/.test(read(f))).map((f) => f.split(path.sep).join('/')).sort();
  assert.deepEqual(readers, ['amida/guide.html', 'amida/index.html']);
});

test('kit.css の共通の枠の後の class は、あみだくじの html か、そのページが読む js のどれかに在る', () => {
  const css = read('kit.css');
  const own = css.slice(css.indexOf('/* yorozu-common:end */')).replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = own.match(/[^{}]+(?=\{)/g).filter((s) => !s.trim().startsWith('@'));
  const classes = new Set(selectors.flatMap((s) => [...s.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map((m) => m[1])));
  const html = ['amida/index.html', 'amida/guide.html'].map(read).join('\n');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => path.posix.join('amida', m[1]));
  const corpus = html + '\n' + scripts.map(read).join('\n');
  const missing = [...classes].filter((c) => !EXTERNAL.has(c) && !new RegExp(`["'\\s]${c}["'\\s]`).test(corpus));
  assert.deepEqual(missing, []);
});
