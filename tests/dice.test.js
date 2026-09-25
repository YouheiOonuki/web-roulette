// サイコロ・コイントス・ランダムな数字のテスト: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../dice.js');

// テスト用の乱数（seed つき。mulberry32 の 32 ビット整数）
function seeded(a) {
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
}

test('uniform: 端を捨てて引き直す（捨てる値が来たら次を使う）', () => {
  const seq = [4294967295, 4294967294, 7];   // n=10: 4294967290 以上は捨てる
  let i = 0;
  assert.equal(D.uniform(10, () => seq[i++]), 7);
  assert.equal(i, 3);
  assert.equal(D.uniform(1, () => 123), 0);
  assert.throws(() => D.uniform(0, () => 1));
});

test('サイコロ: 1〜6 がどれも約 1/6（60,000 回、カイ二乗）・合計', () => {
  const src = seeded(1), c = [0, 0, 0, 0, 0, 0], N = 60000;
  for (let i = 0; i < N; i++) c[D.rollDice(1, src).values[0] - 1]++;
  const e = N / 6, chi = c.reduce((x, v) => x + (v - e) ** 2 / e, 0);
  assert.ok(chi < 20.5, 'chi2=' + chi.toFixed(2) + ' ' + c);   // 自由度 5 の 99.9% 点 20.5
  const r = D.rollDice(3, src);
  assert.equal(r.values.length, 3); assert.equal(r.sum, r.values.reduce((a, b) => a + b));
  assert.equal(r.faces[0], D.FACES[r.values[0] - 1]);
  assert.equal(D.rollDice(99, src).values.length, 10);
});

test('コイン: 表と裏が約半分（20,000 回）', () => {
  const src = seeded(2); let h = 0;
  for (let i = 0; i < 20000; i++) if (D.coin(src) === '表') h++;
  assert.ok(Math.abs(h / 20000 - 0.5) < 0.015, String(h));
});

test('桁の数字: 4 桁は 0000〜9999（先頭の 0 を残す）、各桁の 0〜9 が約 1/10', () => {
  const src = seeded(3), c = new Array(10).fill(0);
  let lead0 = 0;
  for (let i = 0; i < 20000; i++) {
    const s = D.digits(4, src);
    assert.match(s, /^\d{4}$/);
    if (s[0] === '0') lead0++;
    c[+s[3]]++;
  }
  assert.ok(lead0 > 1500, '先頭 0 も出る ' + lead0);
  c.forEach(v => assert.ok(Math.abs(v / 20000 - 0.1) < 0.012, c.join(',')));
  assert.match(D.digits(6, src), /^\d{6}$/);
});

test('範囲の整数: 1〜100・重なりなし・逆順・足りない・広すぎ', () => {
  const src = seeded(4);
  const r = D.ints(1, 100, 20, true, src);
  assert.ok(r.ok); assert.equal(new Set(r.values).size, 20);
  r.values.forEach(v => assert.ok(v >= 1 && v <= 100));
  const all = D.ints(1, 5, 5, true, src).values.slice().sort();
  assert.deepEqual(all, [1, 2, 3, 4, 5]);
  assert.ok(D.ints(10, 1, 1, false, src).values[0] <= 10);
  assert.equal(D.ints(1, 3, 4, true, src).code, 'few');
  assert.equal(D.ints(0, 2e9, 1, false, src).code, 'wide');
  assert.equal(D.ints('a', 3, 1, false, src).code, 'nan');
  let lo = 0, hi = 0;
  for (let i = 0; i < 30000; i++) { const v = D.ints(1, 3, 1, false, src).values[0]; if (v === 1) lo++; if (v === 3) hi++; }
  assert.ok(Math.abs(lo / 30000 - 1 / 3) < 0.015 && Math.abs(hi / 30000 - 1 / 3) < 0.015, lo + ' ' + hi);
});
