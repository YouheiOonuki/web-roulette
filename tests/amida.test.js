// あみだくじのロジックのテスト: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../amida.js');

const isPerm = (p, n) => p.length === n && [...p].sort((a, b) => a - b).every((v, i) => v === i);

test('図のとおりにたどると、決めた並びになる（人数 2〜20・横線の多さ 3 種・各 150 seed）', () => {
  for (let n = 2; n <= 20; n++) {
    for (const d of ['few', 'normal', 'many']) {
      for (let s = 0; s < 150; s++) {
        const a = A.make(n, s * 7919 + n, d);
        const drawn = A.permOfDrawing(a.rungs, n);
        assert.ok(isPerm(drawn, n), 'どのスタートも別のゴール（1 対 1）');
        assert.deepEqual(drawn, a.perm, `n=${n} d=${d} s=${s}`);
      }
    }
  }
});

test('どの縦線にも横線が 1 本以上かかる', () => {
  for (let s = 0; s < 600; s++) {
    const n = 2 + (s % 19), a = A.make(n, s, ['few', 'normal', 'many'][s % 3]);
    const t = new Array(n).fill(false);
    a.rungs.forEach(r => { t[r.g] = t[r.g + 1] = true; });
    assert.ok(t.every(Boolean), 'n=' + n + ' s=' + s);
  }
});

test('横線: 同じ高さで 1 本の縦線に 2 本かからない・範囲は 0〜1・列は 0〜n-2', () => {
  for (let s = 0; s < 300; s++) {
    const n = 2 + (s % 19), a = A.make(n, s, 'many');
    a.rungs.forEach(r => { assert.ok(r.g >= 0 && r.g <= n - 2); assert.ok(r.y > 0 && r.y < 1); });
    for (let i = 0; i < a.rungs.length; i++) for (let j = i + 1; j < a.rungs.length; j++) {
      const x = a.rungs[i], y = a.rungs[j];
      if (Math.abs(x.g - y.g) <= 1) assert.notEqual(x.y, y.y, '同じ縦線にかかる 2 本は高さが違う');
    }
  }
});

test('分解: 並び → 横線 → 並び が元に戻る（逆順の数だけの本数）', () => {
  const rng = A.makeRng(123);
  for (let t = 0; t < 500; t++) {
    const n = 2 + (t % 12), p = A.randomPerm(n, rng), w = A.decompose(p, rng);
    assert.deepEqual(A.permOfWord(w, n), p);
    let inv = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (p[i] > p[j]) inv++;
    assert.equal(w.length, inv);
    const w2 = A.addDecoys(w, n, w.length + 10, rng);
    assert.deepEqual(A.permOfWord(w2, n), p, '飾りとかき混ぜで並びは変わらない');
  }
});

test('公平さ: 4 人の 24 通りが同じ割合で出る（24,000 seed、カイ二乗で確かめる）', () => {
  const N = 24000, cnt = {};
  for (let s = 0; s < N; s++) {
    const a = A.make(4, s, 'normal');
    const k = A.permOfDrawing(a.rungs, 4).join('');
    cnt[k] = (cnt[k] || 0) + 1;
  }
  assert.equal(Object.keys(cnt).length, 24);
  const e = N / 24, chi = Object.values(cnt).reduce((x, c) => x + (c - e) ** 2 / e, 0);
  // 自由度 23 の 99.9% 点は約 49.7
  assert.ok(chi < 49.7, 'chi2=' + chi.toFixed(1));
});

test('公平さ: 5 人・横線少なめでも、左はしのスタートはどのゴールにも約 20%（20,000 seed）', () => {
  for (const d of ['few', 'normal']) {
    const N = 20000, c = [0, 0, 0, 0, 0];
    for (let s = 0; s < N; s++) c[A.trace(A.make(5, s, d).rungs, 5, 0).end]++;
    c.forEach(v => assert.ok(Math.abs(v / N - 0.2) < 0.012, d + ' ' + c.join(',')));
  }
});

test('結果の置き場所もくじ: 「当たり」（入力の 1 つ目）がどの列にも約 1/5（5 人・10,000 seed）', () => {
  const c = [0, 0, 0, 0, 0];
  for (let s = 0; s < 10000; s++) {
    const a = A.make(5, s, 'normal');
    assert.ok(isPerm(a.place, 5));
    c[a.place.indexOf(0)]++;
  }
  c.forEach(v => assert.ok(Math.abs(v / 10000 - 0.2) < 0.015, c.join(',')));
  assert.deepEqual(A.placeResults(['当たり', 'はずれ', 'はずれ'], [2, 0, 1]), ['はずれ', '当たり', 'はずれ']);
});

test('全体として: 1 人目が「当たり」になる割合は 1/n（6 人・12,000 seed）', () => {
  let hit = 0;
  for (let s = 0; s < 12000; s++) {
    const a = A.make(6, s, 'few');
    const res = A.placeResults(A.buildResults('atari', 6, '', 1).list, a.place);
    if (res[A.trace(a.rungs, 6, 0).end] === '当たり') hit++;
  }
  assert.ok(Math.abs(hit / 12000 - 1 / 6) < 0.012, String(hit));
});

test('比べる計算: 横線をでたらめに引くと偏る（使い方ページの数字）', () => {
  const p = A.naiveEndProbs(5, 10, 0);
  assert.equal((p[0] * 100).toFixed(1), '33.6');
  assert.equal((p[4] * 100).toFixed(1), '7.1');
  assert.ok(Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  // 本数を増やすと 20% に近づくが、20 本でもまだ 24.9%
  assert.equal((A.naiveEndProbs(5, 20, 0)[0] * 100).toFixed(1), '24.9');
});

test('同じ seed・人数・多さなら同じ図、seed が違えば（たいてい）違う図', () => {
  assert.deepEqual(A.make(8, 42, 'normal'), A.make(8, 42, 'normal'));
  let same = 0;
  for (let s = 0; s < 100; s++) if (JSON.stringify(A.make(8, s, 'normal').perm) === JSON.stringify(A.make(8, s + 1000, 'normal').perm)) same++;
  assert.ok(same <= 1);
});

test('横線の多さ: 少なめ < ふつう < 多め（平均の本数）、20 人でも段は 60 まで', () => {
  const avg = d => { let t = 0; for (let s = 0; s < 200; s++) t += A.make(10, s, d).rungs.length; return t / 200; };
  const f = avg('few'), n = avg('normal'), m = avg('many');
  assert.ok(f < n && n < m, [f, n, m].join(' '));
  for (let s = 0; s < 300; s++) assert.ok(A.make(20, s, 'many').levels <= 60);
});

test('くじ番号の表示と読み取り', () => {
  assert.equal(A.seedLabel(123), '00000-00123');
  assert.equal(A.parseSeedLabel('00000-00123'), 123);
  assert.equal(A.parseSeedLabel('４２９４９６７２９５'), 4294967295);
  assert.equal(A.parseSeedLabel('4294967296'), null);
  assert.equal(A.parseSeedLabel('あ'), null);
});

test('名前の読み取り: 改行・カンマ・読点、空行を捨てる、20 人まで', () => {
  assert.deepEqual(A.parseLines('青木\n\n井上、上田,江藤').list, ['青木', '井上', '上田', '江藤']);
  const many = Array.from({ length: 25 }, (_, i) => 'p' + i).join('\n');
  const r = A.parseLines(many);
  assert.equal(r.list.length, 20); assert.equal(r.over, 5);
  assert.deepEqual(A.topLabels([], 3), ['1', '2', '3']);
  assert.deepEqual(A.topLabels(['a'], 3), ['1', '2', '3'], '1 人だけならくじにならないので人数を使う');
  assert.deepEqual(A.topLabels(['a', 'b'], 9), ['a', 'b']);
});

test('結果: 当たり k 本／順番／自分で書く（足りない分ははずれ、多い分は切る）', () => {
  assert.deepEqual(A.buildResults('atari', 4, '', 1).list, ['当たり', 'はずれ', 'はずれ', 'はずれ']);
  assert.deepEqual(A.buildResults('atari', 3, '', 9).list, ['当たり', '当たり', 'はずれ'], '当たりは人数-1 まで');
  assert.deepEqual(A.buildResults('order', 3).list, ['1番', '2番', '3番']);
  const c = A.buildResults('custom', 4, '買い出し\n片付け', 1);
  assert.deepEqual(c.list, ['買い出し', '片付け', 'はずれ', 'はずれ']); assert.equal(c.short, 2);
  const d = A.buildResults('custom', 2, 'a\nb\nc', 1);
  assert.deepEqual(d.list, ['a', 'b']); assert.equal(d.cut, 1);
  assert.equal(A.buildResults('custom', 2, '', 1).empty, true);
});

test('共有リンク: 往復・壊れたもの・人数の合わないもの', () => {
  const h = A.encodeShare(['青木', '井上', '上田'], ['当たり', 'はずれ', 'はずれ'], 4000000000, 'many', '買い出し係');
  const r = A.decodeShare('#s=' + h);
  assert.deepEqual(r, { top: ['青木', '井上', '上田'], bottom: ['当たり', 'はずれ', 'はずれ'], seed: 4000000000, density: 'many', title: '買い出し係' });
  assert.equal(A.decodeShare('#s=!!!'), null);
  assert.equal(A.decodeShare('#s=' + A.encodeShare(['a', 'b'], ['x'], 1, 'few')), null);
  assert.equal(A.decodeShare('#x=1'), null);
  assert.equal(A.decodeShare(''), null);
});

test('保存データの正規化', () => {
  const s = A.normalizeState({ count: 99, names: '青木\n井上', kind: 'zzz', atari: 0, seed: -1, density: 'many', printMode: 'fold', credit: false });
  assert.equal(s.count, 20); assert.equal(s.names, '青木\n井上'); assert.equal(s.kind, 'atari');
  assert.equal(s.atari, 1); assert.equal(s.seed, 0); assert.equal(s.density, 'many'); assert.equal(s.printMode, 'fold'); assert.equal(s.credit, false);
  assert.deepEqual(A.normalizeState(null).count, 5);
  assert.equal(A.normalizeState('x').credit, true);
});
