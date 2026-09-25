// ===========================
// あみだくじのロジック（画面から切り離した純粋関数）
// DOM や localStorage に触らない。tests/amida.test.js から node --test で確かめる
// ブラウザでは window.Amida、Node（テスト）では module.exports で使う
//
// 公平さの作り方（guide の「しくみ」と同じ内容）:
//   1. 先に「だれがどの結果になるか」（並び＝置換）を、n! 通りのどれも同じ確率になるように決める（Fisher–Yates）
//   2. その並びになる横線を後から描く（隣どうしの入れ替えに分解する）。飾りの横線（2 本で打ち消し合う組）を足して、
//      入れ替えの順番を並びが変わらない操作（離れた横線の入れ替え・3 本の組み替え）でかき混ぜる
//   横線をでたらめに引く作り方は、横線が少ないと「真下に近い結果」に偏る（naiveEndProbs で計算できる）
// 同じくじ番号（seed）・同じ人数・同じ横線の多さからは、いつでも同じあみだになる（Math.random を使わない）
// ===========================
(function (root) {
  'use strict';

  var LIMITS = { people: 20, nameLen: 16, textLen: 4000, titleLen: 40 };
  var DENSITY = { few: 1, normal: 2, many: 4 };   // 横線の数の目安（人数 × この数まで飾りの横線を足す）

  // ---------------------------------------------------------------
  // 乱数（seed つき）。席替え・当番表・学習プリントと同じ mulberry32
  // ---------------------------------------------------------------
  function mulberry32(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mixSeed(seed, salt) {
    var h = ((seed >>> 0) ^ Math.imul((salt | 0) + 1, 0x9E3779B1)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B);
    h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function makeRng(seed, salt) {
    var r = mulberry32(mixSeed(seed, salt || 0));
    return { next: r, int: function (n) { return Math.floor(r() * n); } };   // 0〜n-1
  }
  /** くじ番号（seed を 5 桁-5 桁で。口で伝えやすい形。当番表・席替えと同じ） */
  function seedLabel(seed) {
    var s = String(seed >>> 0).padStart(10, '0');
    return s.slice(0, 5) + '-' + s.slice(5);
  }
  /** "01234-56789" や全角の数字を seed に戻す。読めなければ null */
  function parseSeedLabel(s) {
    var d = String(s == null ? '' : s).replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).replace(/[^0-9]/g, '');
    if (!d || d.length > 10) return null;
    var n = Number(d);
    return n <= 4294967295 ? n : null;
  }

  // ---------------------------------------------------------------
  // 1. 並び（置換）: perm[スタートの列] = ゴールの列。n! 通りが同じ確率
  // ---------------------------------------------------------------
  function randomPerm(n, rng) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = n - 1; j > 0; j--) {
      var k = rng.int(j + 1);
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  /** 横線の列（上から順。g は「g 列目と g+1 列目の間」）を上からたどったときの並び */
  function permOfWord(word, n) {
    var at = [];                     // at[列] = いまその列にいる人（スタートの列の番号）
    for (var i = 0; i < n; i++) at.push(i);
    word.forEach(function (g) { var t = at[g]; at[g] = at[g + 1]; at[g + 1] = t; });
    var perm = new Array(n);
    at.forEach(function (who, col) { perm[who] = col; });
    return perm;
  }

  // ---------------------------------------------------------------
  // 2. 並びを横線に分解する
  //    ゴールの並び T（T[列] = そこに着く人）を、隣どうしの逆順を 1 つずつランダムに選んで直していく（バブルソートの順をランダムに）。
  //    直した操作を逆の順に並べると、まっすぐの状態から T を作る横線の列になる（入れ替えは 2 回で元に戻るため）
  // ---------------------------------------------------------------
  function decompose(perm, rng) {
    var n = perm.length, T = new Array(n);
    perm.forEach(function (col, who) { T[col] = who; });
    var ops = [];
    for (;;) {
      var inv = [];
      for (var g = 0; g < n - 1; g++) if (T[g] > T[g + 1]) inv.push(g);
      if (!inv.length) break;
      var p = inv[rng.int(inv.length)];
      var t = T[p]; T[p] = T[p + 1]; T[p + 1] = t;
      ops.push(p);
    }
    return ops.reverse();
  }

  /**
   * 飾りの横線を足して、並びを変えずにかき混ぜる
   *   - 同じ間に 2 本続けて入れる（2 回入れ替えると元どおり）。横線のかからない縦線が残らないように先に足す
   *   - 離れた横線（間が 2 つ以上離れている）どうしは順番を入れ替えてよい
   *   - 「g, g+1, g」は「g+1, g, g+1」と同じ（3 本の組み替え）
   */
  function addDecoys(word, n, target, rng) {
    var w = word.slice();
    if (n < 2) return w;
    // どの縦線にも 1 本は横線がかかるようにする（まっすぐ下りる線があると、見た目で「細工した」と思われやすい）
    var touched = new Array(n).fill(false);
    w.forEach(function (g) { touched[g] = touched[g + 1] = true; });
    for (var c = 0; c < n; c++) {
      if (touched[c]) continue;
      var gc = c === 0 ? 0 : c === n - 1 ? n - 2 : c - rng.int(2);
      w.splice(rng.int(w.length + 1), 0, gc, gc);
      touched[gc] = touched[gc + 1] = true;
    }
    while (w.length < target) {
      var g = rng.int(n - 1), at = rng.int(w.length + 1);
      w.splice(at, 0, g, g);
    }
    var moves = w.length * 12;
    for (var m = 0; m < moves && w.length > 1; m++) {
      var i = rng.int(w.length - 1);
      if (Math.abs(w[i] - w[i + 1]) >= 2) {
        var t = w[i]; w[i] = w[i + 1]; w[i + 1] = t;
      } else if (i + 2 < w.length && w[i] === w[i + 2] && Math.abs(w[i] - w[i + 1]) === 1) {
        var a = w[i], b = w[i + 1];
        w[i] = b; w[i + 1] = a; w[i + 2] = b;
      }
    }
    return w;
  }

  /**
   * 横線の高さを決める。同じ列にかかる横線は上から順の段に置き、段の中で少しずらす（手で引いたように）
   * @returns {{rungs: {g:number, y:number}[], levels:number}} y は 0〜1（上が 0）
   */
  function layout(word, n, rng) {
    var last = new Array(n).fill(-1), lv = [];
    word.forEach(function (g) {
      var L = Math.max(last[g], last[g + 1]) + 1;
      last[g] = last[g + 1] = L;
      lv.push(L);
    });
    var levels = lv.length ? Math.max.apply(null, lv) + 1 : 0;
    var rungs = word.map(function (g, i) {
      var y = (lv[i] + 0.5 + (rng.next() - 0.5) * 0.6) / levels;   // 段の中で ±0.3 段。隣の段とは入れ替わらない
      return { g: g, y: Math.round((0.04 + y * 0.92) * 10000) / 10000 };
    });
    return { rungs: rungs, levels: levels };
  }

  /**
   * 人数・くじ番号・横線の多さから、あみだを作る
   * @returns {{n, perm, rungs, levels, place}} perm[スタートの列] = ゴールの列、place[ゴールの列] = 結果の番号（入力した順）
   */
  function make(n, seed, density) {
    n = Math.max(2, Math.min(LIMITS.people, n | 0));
    var rng = makeRng(seed, 1);
    var perm = randomPerm(n, rng);
    var word = decompose(perm, rng);
    var target = Math.max(word.length, Math.round(n * (DENSITY[density] || DENSITY.normal)));
    if ((target - word.length) % 2) target++;   // 飾りは 2 本ずつ
    word = addDecoys(word, n, target, rng);
    var lay = layout(word, n, rng);
    // 結果を下のどの列に置くかも、くじで決める（「当たり」がいつも左はしだと、線を目でたどって狙えるため）
    var place = randomPerm(n, makeRng(seed, 2));
    return { n: n, perm: perm, rungs: lay.rungs, levels: lay.levels, place: place };
  }

  /**
   * 図の横線を上からたどる（画面のアニメーションも、この点の列を使う）
   * @returns {{end:number, points:number[][]}} points は [列, y] の列（y は 0〜1）
   */
  function trace(rungs, n, start) {
    var sorted = rungs.slice().sort(function (a, b) { return a.y - b.y; });
    var col = start, pts = [[col, 0]];
    sorted.forEach(function (r) {
      if (r.g === col) { pts.push([col, r.y]); col = col + 1; pts.push([col, r.y]); }
      else if (r.g === col - 1) { pts.push([col, r.y]); col = col - 1; pts.push([col, r.y]); }
    });
    pts.push([col, 1]);
    return { end: col, points: pts };
  }

  /** 下の列に並べる結果（入力した順の results を place で並べ替える） */
  function placeResults(results, place) { return place.map(function (k) { return results[k]; }); }

  /** 図のとおりにたどった並び（テストで perm と一致を確かめる） */
  function permOfDrawing(rungs, n) {
    var p = [];
    for (var s = 0; s < n; s++) p.push(trace(rungs, n, s).end);
    return p;
  }

  /**
   * 比べるための計算: 横線を「でたらめな間に k 本」引いたときに、start 列から各列に着く確率（正確な値）
   * 公平なら どの列も 1/n。横線が少ないと真下と近くに偏る（使い方ページの数字はこれで出した）
   */
  function naiveEndProbs(n, k, start) {
    var p = new Array(n).fill(0); p[start] = 1;
    for (var s = 0; s < k; s++) {
      var q = new Array(n).fill(0);
      for (var c = 0; c < n; c++) {
        if (!p[c]) continue;
        for (var g = 0; g < n - 1; g++) {
          var d = g === c ? c + 1 : g === c - 1 ? c - 1 : c;
          q[d] += p[c] / (n - 1);
        }
      }
      p = q;
    }
    return p;
  }

  // ---------------------------------------------------------------
  // 入力
  // ---------------------------------------------------------------
  function str(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max); }
  function intIn(v, lo, hi, dflt) {
    var n = Math.round(Number(v));
    return v !== null && v !== '' && v !== undefined && isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
  }
  function oneOf(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }

  /** 1 行 1 つ（カンマ・読点でも区切れる）。空行は捨てる。21 個目からは捨てて over に数を入れる */
  function parseLines(text) {
    var out = [], over = 0;
    String(text || '').slice(0, LIMITS.textLen).split(/[\r\n,，、]+/).forEach(function (s) {
      s = str(s.replace(/　/g, ' '), LIMITS.nameLen);
      if (!s) return;
      if (out.length < LIMITS.people) out.push(s); else over++;
    });
    return { list: out, over: over };
  }

  /** 上に並ぶ名前。名前が無ければ 1, 2, 3 … */
  function topLabels(names, count) {
    if (names.length >= 2) return names.slice();
    var n = intIn(count, 2, LIMITS.people, 5), a = [];
    for (var i = 1; i <= n; i++) a.push(String(i));
    return a;
  }

  /**
   * 下に並ぶ結果。kind: 'atari'（当たり k 本・残りははずれ）／'order'（1 番〜n 番）／'custom'（自分で書く）
   * custom が人数より少ないときは残りを「はずれ」、多いときは人数で切る（short / cut に数を返す）
   */
  function buildResults(kind, n, customText, atari) {
    var i, r = [];
    if (kind === 'order') {
      for (i = 1; i <= n; i++) r.push(i + '番');
      return { list: r, short: 0, cut: 0 };
    }
    if (kind === 'custom') {
      var c = parseLines(customText).list, short = Math.max(0, n - c.length), cut = Math.max(0, c.length - n);
      r = c.slice(0, n);
      while (r.length < n) r.push('はずれ');
      return { list: r, short: c.length ? short : 0, cut: cut, empty: !c.length };
    }
    var k = intIn(atari, 1, n - 1, 1);
    for (i = 0; i < n; i++) r.push(i < k ? '当たり' : 'はずれ');
    return { list: r, short: 0, cut: 0 };
  }

  // ---------------------------------------------------------------
  // 保存・共有
  // ---------------------------------------------------------------
  var KINDS = ['atari', 'order', 'custom'], DENS = ['few', 'normal', 'many'], PRINT = ['full', 'fold', 'blank'];

  function normalizeState(o) {
    o = o && typeof o === 'object' && !Array.isArray(o) ? o : {};
    var seed = Number(o.seed);
    return {
      count: intIn(o.count, 2, LIMITS.people, 5),
      names: normText(o.names),
      kind: oneOf(o.kind, KINDS, 'atari'),
      atari: intIn(o.atari, 1, LIMITS.people - 1, 1),
      custom: normText(o.custom),
      density: oneOf(o.density, DENS, 'normal'),
      seed: isFinite(seed) && seed >= 0 && seed <= 4294967295 ? Math.floor(seed) : 0,
      title: str(o.title, LIMITS.titleLen),
      printMode: oneOf(o.printMode, PRINT, 'full'),
      credit: o.credit !== false,
      hide: o.hide === true,
    };
  }
  // textarea の値（1 行 1 つ）: 行を保ったまま、行ごとに長さをそろえる（str は改行を空白にするので行ごとに通す）
  function normText(v) {
    return String(v == null ? '' : v).slice(0, LIMITS.textLen).split(/\r?\n/).map(function (s) { return str(s, LIMITS.nameLen); }).join('\n');
  }

  function b64uEncode(s) {
    var bytes = new TextEncoder().encode(s), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64uDecode(s) {
    var b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /** 共有リンクの # 以降（s= の後ろ）。名前・結果・くじ番号・横線の多さ・見出し。図は同じ計算で作り直す */
  function encodeShare(top, bottom, seed, density, title) {
    var o = { v: 1, t: top, b: bottom, s: seed >>> 0, d: density };
    if (title) o.h = title;
    return b64uEncode(JSON.stringify(o));
  }
  /** 読めないもの・人数の合わないものは null */
  function decodeShare(hash) {
    var m = /(?:^#|&)s=([A-Za-z0-9_-]+)/.exec(String(hash || ''));
    if (!m) return null;
    var o;
    try { o = JSON.parse(b64uDecode(m[1])); } catch (e) { return null; }
    if (!o || o.v !== 1 || !Array.isArray(o.t) || !Array.isArray(o.b)) return null;
    var top = o.t.map(function (x) { return str(x, LIMITS.nameLen); });
    var bottom = o.b.map(function (x) { return str(x, LIMITS.nameLen); });
    if (top.length < 2 || top.length > LIMITS.people || bottom.length !== top.length) return null;
    if (top.concat(bottom).some(function (x) { return !x; })) return null;
    var seed = Number(o.s);
    if (!isFinite(seed) || seed < 0 || seed > 4294967295) return null;
    return { top: top, bottom: bottom, seed: Math.floor(seed), density: oneOf(o.d, DENS, 'normal'), title: str(o.h, LIMITS.titleLen) };
  }

  var api = {
    LIMITS: LIMITS, DENSITY: DENSITY,
    makeRng: makeRng, seedLabel: seedLabel, parseSeedLabel: parseSeedLabel,
    randomPerm: randomPerm, permOfWord: permOfWord, decompose: decompose, addDecoys: addDecoys, layout: layout,
    make: make, placeResults: placeResults, trace: trace, permOfDrawing: permOfDrawing, naiveEndProbs: naiveEndProbs,
    parseLines: parseLines, topLabels: topLabels, buildResults: buildResults,
    normalizeState: normalizeState, encodeShare: encodeShare, decodeShare: decodeShare,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Amida = api;
})(this);
