// デバッグの節と「テストモード」を外した後の確かめ（yorozu-plans Q-1083、ROADMAP 7.268）: node --test tests/*.test.js
// 作る時の確かめにだけ使っていた物で、使う人には意味の無い働きだったので消した。戻っていない事と、消して壊れた所が無い事を見る
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('index.html・main.js・style.css にデバッグの節とテストモードが無い', () => {
  for (const f of ['index.html', 'main.js', 'style.css']) {
    const s = read(f);
    for (const w of ['debug', 'デバッグ', 'テストモード', 'testMode', 'test-toggle', 'test-setting']) {
      assert.ok(!s.includes(w), f + ' に ' + w + ' が残っている');
    }
  }
});

test('main.js が getElementById で引く id は、全部 index.html に在る', () => {
  const html = read('index.html');
  const ids = [...read('main.js').matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
  assert.ok(ids.length > 20);
  for (const id of new Set(ids)) assert.ok(html.includes('id="' + id + '"'), 'index.html に id="' + id + '" が無い');
});

test('pick.js は seeded を出したまま（hade の tests が同じ URL の pick.js で使う）', () => {
  const P = require('../pick.js');
  assert.equal(typeof P.seeded, 'function');
  assert.equal(typeof P.pickMultiple, 'function');
});
