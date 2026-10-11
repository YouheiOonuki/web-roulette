// ===========================
// ルーレットの抽選（/web-roulette/ と、あほらし館の /hade/roulette/ が同じ URL で読む。写しを持たない: D312・ROADMAP 7.46.1）
// 乱数の出どころ（0 以上 1 未満を返す関数）を外から受け取る純粋関数。ブラウザでは Math.random、テストと「テストモード」では seeded(42)
// ブラウザでは window.RoulettePick、Node（テスト）では module.exports で使う
// ===========================
(function (root) {
  'use strict';

  /** 貼った文を候補の名前の列に（区切り: 'newline' | 'comma' | 'semicolon'）。前後の空白を取り、空の行は捨てる */
  function parseText(text, delimiterType) {
    var sep;
    switch (delimiterType) {
      case 'comma': sep = ','; break;
      case 'semicolon': sep = ';'; break;
      default: sep = '\n';
    }
    return String(text).split(sep)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  /** 種つきの乱数（Park–Miller。テストモードの再現用） */
  function seeded(seed) {
    var s = seed;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /**
   * candidates（{ name, weight }[]）から count 個を重なりなく選ぶ。weighted なら weight（1〜3）の重み
   * 返り: [{ index（元の位置）, candidate: { name, weight } }]
   */
  function pickMultiple(candidates, count, weighted, rand) {
    if (!candidates.length) return [];
    var n = Math.min(count, candidates.length);
    var remaining = candidates.map(function (c, i) { return { name: c.name, weight: c.weight, originalIndex: i }; });
    var results = [];
    for (var r = 0; r < n; r++) {
      var picked;
      if (!weighted) {
        var idx = Math.floor(rand() * remaining.length);
        picked = remaining[idx];
        remaining.splice(idx, 1);
      } else {
        var pool = [];
        remaining.forEach(function (c, i) { for (var w = 0; w < c.weight; w++) pool.push(i); });
        var remIdx = pool[Math.floor(rand() * pool.length)];
        picked = remaining[remIdx];
        remaining.splice(remIdx, 1);
      }
      results.push({ index: picked.originalIndex, candidate: { name: picked.name, weight: picked.weight } });
    }
    return results;
  }

  var api = { parseText: parseText, seeded: seeded, pickMultiple: pickMultiple };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RoulettePick = api;
})(this);
