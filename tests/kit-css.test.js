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

// 共通の枠の後の、画面の規則（@media print の中を除く）の [セレクタ, font-size] を上から
function screenFontSizes() {
  const css = read('kit.css');
  const own = css.slice(css.indexOf('/* yorozu-common:end */')).replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const stack = [];   // 開いている括弧ごとに、その前の字（セレクタか @ の規則）
  let buf = '';
  for (const ch of own) {
    if (ch === '{') { stack.push(buf.trim()); buf = ''; }
    else if (ch === '}') {
      const sel = stack.pop();
      if (!stack.some((s) => /^@media\s+print\b/.test(s)) && !sel.startsWith('@')) {
        for (const m of buf.matchAll(/(?:^|;)\s*font-size\s*:\s*([^;]+)/g)) out.push([sel.replace(/\s+/g, ' '), m[1].trim()]);
      }
      buf = '';
    } else buf += ch;
  }
  return out;
}

test('kit.css の画面の字の大きさは、共通の 4 段の変数か、font: inherit に続く入力の 1rem（D579・Q-737）', () => {
  const tiers = new Set(['var(--fs-s)', 'var(--fs-m)', 'var(--fs-l)', 'var(--fs-xl)']);
  // 残したもの: あみだの名前の札。--fs-s にすると 1 行に入っていた名前が 2 行に折れる（Q-737）
  const kept = new Map([['.ladder-top button, .ladder-bottom span', '0.82rem']]);
  // 寄せると今より小さくなる 0.9〜0.95rem（14.4〜15.2px → 14px）。字の読めない子も触るので Fable の答えまで今のまま（Q-737）
  const pending = new Set(['0.9rem', '0.92rem', '0.95rem']);
  const all = screenFontSizes();
  assert.ok(all.length > 10, `font-size を ${all.length} 件しか拾えていない`);
  const bad = all.filter(([sel, v]) => {
    if (tiers.has(v) || pending.has(v) || kept.get(sel) === v) return false;
    return !(v === '1rem' && sel === 'textarea');
  });
  assert.deepEqual(bad, []);
});

test('kit.css の画面の見出し（.app-header h1・.card h2）は字の大きさを持たず、共通の皮に任せる（Q-737）', () => {
  const sels = screenFontSizes().map(([sel]) => sel);
  assert.ok(!sels.some((s) => /(^|,\s*)(\.app-header h1|\.card h2)$/.test(s)), sels.join(' / '));
});
