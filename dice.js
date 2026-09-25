// ===========================
// サイコロ・コイントス・ランダムな数字（K98 の小道具。/web-roulette/dice/）
// 乱数の出どころ（src: 0〜2^32-1 の整数を返す関数）を外から受け取る純粋関数。
//   ブラウザでは crypto.getRandomValues（cryptoSource）、テストでは seed つきのものを渡す
// 0〜n-1 は「割り切れない端を捨てて引き直す」方法で出すので、どの数も同じ確率になる（% だけだと小さい数が少し出やすい）
// ブラウザでは window.Dice、Node（テスト）では module.exports で使う
// ===========================
(function (root) {
  'use strict';

  var FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  var LIMITS = { dice: 10, count: 20, span: 1e9 };

  function cryptoSource() {
    var buf = new Uint32Array(1);
    return function () { crypto.getRandomValues(buf); return buf[0]; };
  }

  /** 0〜n-1（n は 1〜2^32）。どの数も同じ確率 */
  function uniform(n, src) {
    if (!(n >= 1 && n <= 4294967296)) throw new RangeError('n');
    var lim = 4294967296 - (4294967296 % n);   // この値以上は捨てる
    for (;;) {
      var x = src() >>> 0;
      if (x < lim) return x % n;
    }
  }

  /** サイコロを k 個（1〜10）。目と合計 */
  function rollDice(k, src) {
    k = Math.max(1, Math.min(LIMITS.dice, k | 0));
    var v = [];
    for (var i = 0; i < k; i++) v.push(uniform(6, src) + 1);
    return { values: v, faces: v.map(function (x) { return FACES[x - 1]; }), sum: v.reduce(function (a, b) { return a + b; }, 0) };
  }

  function coin(src) { return uniform(2, src) === 0 ? '表' : '裏'; }

  /** d 桁の数字（先頭の 0 も残す。4 桁なら 0000〜9999 の 1 万通り） */
  function digits(d, src) {
    d = Math.max(1, Math.min(12, d | 0));
    var s = '';
    for (var i = 0; i < d; i++) s += uniform(10, src);
    return s;
  }

  /**
   * min〜max の整数を count 個。unique なら重なりなし（数が足りなければ ok: false）
   * @returns {{ok:boolean, values?:number[], code?:string}}
   */
  function ints(min, max, count, unique, src) {
    min = Math.round(Number(min)); max = Math.round(Number(max)); count = Math.round(Number(count));
    if (!isFinite(min) || !isFinite(max)) return { ok: false, code: 'nan' };
    if (min > max) { var t = min; min = max; max = t; }
    var span = max - min + 1;
    if (span > LIMITS.span || Math.abs(min) > 1e12 || Math.abs(max) > 1e12) return { ok: false, code: 'wide' };
    count = Math.max(1, Math.min(LIMITS.count, isFinite(count) ? count : 1));
    if (unique && count > span) return { ok: false, code: 'few' };
    var out = [], seen = {};
    while (out.length < count) {
      var v = min + uniform(span, src);
      if (unique && seen[v]) continue;
      seen[v] = 1;
      out.push(v);
    }
    return { ok: true, values: out };
  }

  var api = { FACES: FACES, LIMITS: LIMITS, cryptoSource: cryptoSource, uniform: uniform, rollDice: rollDice, coin: coin, digits: digits, ints: ints };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Dice = api;
})(this);
