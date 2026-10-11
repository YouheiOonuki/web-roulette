// ルーレットの抽選（pick.js）のテスト: node --test tests/*.test.js
// 5000兆円欲しい館（/hade/roulette/）も同じ pick.js を同じ URL で読む（ROADMAP 7.46.1）
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../pick.js');

const C = ['カレー', 'ラーメン', '寿司', '焼肉', 'パスタ'].map((name) => ({ name, weight: 1 }));

test('parseText: 区切りごとに分け、空白と空の行を捨てる', () => {
  assert.deepEqual(P.parseText(' a \n\nb\n c', 'newline'), ['a', 'b', 'c']);
  assert.deepEqual(P.parseText('a, b,,c', 'comma'), ['a', 'b', 'c']);
  assert.deepEqual(P.parseText('a;b', 'semicolon'), ['a', 'b']);
});

test('seeded: 同じ種なら同じ列（テストモードの 42 は main.js の元の式と同じ値）', () => {
  const a = P.seeded(42), b = P.seeded(42);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
  assert.equal(P.seeded(42)(), ((42 * 16807) % 2147483647 - 1) / 2147483646);
});

test('pickMultiple: 重なりなく count 個、候補より多くは選ばない、同じ種なら同じ当たり', () => {
  const r = P.pickMultiple(C, 3, false, P.seeded(7));
  assert.equal(r.length, 3);
  assert.equal(new Set(r.map((x) => x.index)).size, 3);
  assert.deepEqual(r, P.pickMultiple(C, 3, false, P.seeded(7)));
  assert.equal(P.pickMultiple(C, 9, false, Math.random).length, 5);
  assert.deepEqual(P.pickMultiple([], 1, false, Math.random), []);
});

test('pickMultiple: 重みつきは重みの比で選ぶ（重み 3 の候補が 1 の候補のおよそ 3 倍）', () => {
  const w = [{ name: 'a', weight: 3 }, { name: 'b', weight: 1 }];
  const rand = P.seeded(1);
  let a = 0;
  for (let i = 0; i < 4000; i++) if (P.pickMultiple(w, 1, true, rand)[0].candidate.name === 'a') a++;
  assert.ok(a > 2800 && a < 3200, String(a));
});
