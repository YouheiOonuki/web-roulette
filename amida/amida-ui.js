// ===========================
// あみだくじの画面（/web-roulette/amida/）
// 計算は ../amida.js（window.Amida）。ここは入力・図・アニメーション・印刷・共有・保存だけ
// ===========================
(function () {
  'use strict';
  var A = window.Amida, B = window.Backup;
  var KEY = 'web-roulette_amida';          // README「ツールを追加するとき」12: <リポジトリ名>_ で始める
  var TOOL = 'web-roulette';
  var ROULETTE_KEYS = { candidates: 'roulette_candidates', settings: 'roulette_settings', history: 'roulette_history' };
  // 線の色（白地・黒地のどちらでも見える中くらいの明るさ）
  var COLORS = ['#d9534f', '#2e86de', '#27ae60', '#e67e22', '#8e44ad', '#16a085', '#c2185b', '#b8860b'];
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(id) { return document.getElementById(id); }
  function newSeed() {
    try { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0]; }
    catch (e) { return Math.floor(Math.random() * 4294967296); }
  }
  function load() {
    try { var s = localStorage.getItem(KEY); return s ? A.normalizeState(JSON.parse(s)) : null; } catch (e) { return null; }
  }
  function save() {
    if (shared) return;   // 共有リンクで開いた画面は端末のデータを書きかえない
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 保存できなくても使える */ }
  }

  var state = load() || A.normalizeState({});
  if (!state.seed) state.seed = newSeed();
  var shared = A.decodeShare(location.hash);

  // いまのくじ（上の名前・下の結果・図）
  var cur = null;
  var revealed = [];     // たどった順のスタートの列
  var allShown = false;

  function compute() {
    var top, info = [];
    if (shared) {
      top = shared.top;
      var sl = A.make(top.length, shared.seed, shared.density);
      cur = { top: top, results: shared.bottom, bottom: A.placeResults(shared.bottom, sl.place), fromNames: true, lad: sl, seed: shared.seed, title: shared.title };
      return;
    }
    var p = A.parseLines(state.names);
    var fromNames = p.list.length >= 2;
    top = A.topLabels(p.list, state.count);
    if (p.over) info.push('21 人目からは入りません（' + p.over + ' 人）。');
    if (p.list.length === 1) info.push('名前が 1 人だけなので、人数の番号で作っています。');
    var r = A.buildResults(state.kind, top.length, state.custom, state.atari);
    if (state.kind === 'custom' && r.empty) info.push('結果を 1 行に 1 つ書いてください。今は全部「はずれ」です。');
    else if (r.short) info.push('結果が ' + r.short + ' つ足りないので「はずれ」にしました。');
    if (r.cut) info.push('結果が人数より ' + r.cut + ' つ多いので、下の ' + r.cut + ' つは使いません。');
    var lad = A.make(top.length, state.seed, state.density);
    cur = { top: top, results: r.list, bottom: A.placeResults(r.list, lad.place), fromNames: fromNames, lad: lad, seed: state.seed, title: state.title };
    $('input-info').textContent = top.length + ' 人' + (info.length ? '。' + info.join('') : '');
    $('count').disabled = fromNames;
    if (fromNames) $('count').value = top.length;
  }

  // ---------------------------------------------------------------
  // 図
  // ---------------------------------------------------------------
  var geo = null;   // { colW, H, pad }
  var botV = false; // 結果の行を縦に積むか
  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function pathD(points) {
    return points.map(function (p, i) {
      return (i ? 'L' : 'M') + ((p[0] + 0.5) * geo.colW).toFixed(1) + ' ' + (geo.pad + p[1] * (geo.H - 2 * geo.pad)).toFixed(1);
    }).join(' ');
  }

  function renderLadder() {
    var box = $('ladder'), n = cur.top.length, lad = cur.lad;
    var W = box.parentNode.clientWidth || 340;
    var colW = Math.max(46, Math.floor(W / n));
    // 横に入りきらない行だけ縦書きにする（13px の字で、枠の内側に何字入るか）
    var fits = function (list) { var mx = list.reduce(function (m, s) { return Math.max(m, Array.from(s).length); }, 0); return mx * 13.5 <= colW - 10; };
    var H = Math.max(200, Math.min(640, lad.levels * 18 + 30)), pad = 10;
    geo = { colW: colW, H: H, pad: pad };
    box.innerHTML = '';
    box.style.width = (colW * n) + 'px';
    box.style.setProperty('--n', n);
    box.style.setProperty('--col', colW + 'px');
    box.classList.toggle('hide-rungs', !!(state.hide && !shared) && !allShown);

    var topRow = document.createElement('div');
    var topV = !fits(cur.top);
    topRow.className = 'ladder-row ladder-top' + (topV ? ' narrow' : '');
    cur.top.forEach(function (name, i) {
      var b = document.createElement('button');
      b.type = 'button';
      setLabel(b, name, topV);
      b.setAttribute('aria-label', name + ' の線をたどる');
      b.addEventListener('click', function () { traceFrom(i, true); });
      if (revealed.indexOf(i) >= 0) b.classList.add('done');
      topRow.appendChild(b);
    });
    box.appendChild(topRow);

    var svg = el('svg', { viewBox: '0 0 ' + (colW * n) + ' ' + H, height: H, role: 'img', 'aria-label': 'あみだくじの線（縦 ' + n + ' 本・横 ' + lad.rungs.length + ' 本）' });
    for (var c = 0; c < n; c++) svg.appendChild(el('line', { class: 'v', x1: (c + 0.5) * colW, x2: (c + 0.5) * colW, y1: 0, y2: H }));
    lad.rungs.forEach(function (r) {
      var y = pad + r.y * (H - 2 * pad);
      svg.appendChild(el('line', { class: 'h', x1: (r.g + 0.5) * colW, x2: (r.g + 1.5) * colW, y1: y, y2: y }));
    });
    var paths = el('g', { id: 'paths' });
    svg.appendChild(paths);
    box.appendChild(svg);

    var bottomRow = document.createElement('div');
    botV = !fits(cur.bottom.concat(['？']));
    bottomRow.className = 'ladder-row ladder-bottom' + (botV ? ' narrow' : '');
    cur.bottom.forEach(function (res, i) {
      var s = document.createElement('span');
      s.id = 'res-' + i;
      bottomRow.appendChild(s);
    });
    box.appendChild(bottomRow);

    revealed.forEach(function (i) { traceFrom(i, false); });
    if (allShown) for (var k = 0; k < n; k++) showEnd(k);
    updateBottom();
  }

  // 縦に並べる行（.narrow）は 1 字ずつ改行して積む（CSS の縦書きは端末のフォントで字が重なることがあったため）
  function setLabel(e, text, vertical) { e.textContent = vertical ? Array.from(text).join('\n') : text; }

  function endOf(i) { return A.trace(cur.lad.rungs, cur.top.length, i).end; }
  function isShown(endCol) {
    if (allShown) return true;
    return revealed.some(function (i) { return endOf(i) === endCol && shownDone[i]; });
  }
  var shownDone = {};
  function showEnd(i) { shownDone[i] = true; }

  function updateBottom() {
    cur.bottom.forEach(function (res, col) {
      var s = $('res-' + col);
      if (!s) return;
      var on = isShown(col);
      setLabel(s, on ? res : '？', botV);
      s.className = on ? 'shown' : 'hidden-res';
      s.setAttribute('aria-label', on ? res : 'まだ見えない結果');
    });
    var list = $('all-results');
    list.innerHTML = '';
    var order = allShown ? cur.top.map(function (_, i) { return i; }) : revealed.filter(function (i) { return shownDone[i]; });
    order.forEach(function (i) {
      var li = document.createElement('li');
      var b = document.createElement('b');
      b.textContent = cur.top[i];
      li.appendChild(b);
      li.appendChild(document.createTextNode(' → ' + cur.bottom[endOf(i)]));
      list.appendChild(li);
    });
    $('reveal-all').disabled = allShown;
  }

  function traceFrom(i, animate) {
    var g = $('paths');
    if (!g) return;
    var first = revealed.indexOf(i) < 0;
    if (first) revealed.push(i);
    var old = g.querySelector('[data-start="' + i + '"]');
    if (old) old.remove();
    var t = A.trace(cur.lad.rungs, cur.top.length, i);
    var path = el('path', { class: 'path', d: pathD(t.points), stroke: COLORS[i % COLORS.length], 'data-start': i });
    g.appendChild(path);
    var btn = $('ladder').querySelectorAll('.ladder-top button')[i];
    if (btn) btn.classList.add('done');
    if (!animate || reduceMotion || !path.getTotalLength) { showEnd(i); if (animate) updateBottom(); return; }
    var len = path.getTotalLength();
    path.style.strokeDasharray = len + ' ' + len;
    path.style.strokeDashoffset = len;
    path.getBoundingClientRect();   // 最初の位置を描かせてから動かす
    var ms = Math.min(2600, 700 + len * 2.2);
    path.style.transition = 'stroke-dashoffset ' + ms + 'ms linear';
    path.style.strokeDashoffset = '0';
    // 図が枠より広いとき（人数が多いとき）は、線が進む先の列が見えるように枠の中だけ横に動かす
    var wrap = $('ladder').parentNode;
    if (wrap.scrollWidth > wrap.clientWidth) {
      wrap.scrollTo({ left: (i + 0.5) * geo.colW - wrap.clientWidth / 2, behavior: 'smooth' });
      setTimeout(function () { wrap.scrollTo({ left: (t.end + 0.5) * geo.colW - wrap.clientWidth / 2, behavior: 'smooth' }); }, ms * 0.6);
    }
    setTimeout(function () { showEnd(i); updateBottom(); }, ms);
  }

  function resetReveal() { revealed = []; shownDone = {}; allShown = false; }

  function refresh(keepReveal) {
    if (!keepReveal) resetReveal();
    compute();
    renderLadder();
    $('seed-label').textContent = 'くじ番号 ' + A.seedLabel(cur.seed) + '（横線 ' + cur.lad.rungs.length + ' 本）';
    summaries();
  }

  function summaries() {
    var dens = { few: '少なめ', normal: 'ふつう', many: '多め' }[shared ? shared.density : state.density];
    var pm = { full: '名前と結果を入れる', fold: '結果を折って隠す', blank: '線だけ' }[state.printMode];
    window.YorozuScreen.detailsSummary({ 'opt-lines': dens + (state.hide && !shared ? '・たどるまで隠す' : ''), 'opt-print': 'A4 縦・' + pm });
  }

  // ---------------------------------------------------------------
  // 印刷（A4 縦。SVG を mm で描く）
  // ---------------------------------------------------------------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function labelSvg(x, y, w, h, text) {
    if (!text) return '';
    var len = Array.from(text).length, fs;
    fs = Math.min(5.2, (w - 1.5) / len);
    if (fs >= 2.6) return '<text x="' + (x + w / 2).toFixed(2) + '" y="' + (y + h / 2 + fs * 0.36).toFixed(2) + '" font-size="' + fs.toFixed(2) + '" text-anchor="middle">' + esc(text) + '</text>';
    // 縦書き: 1 字ずつ積む
    fs = Math.min(4.6, (h - 2) / len, w * 0.82);
    var out = '', y0 = y + (h - fs * len) / 2 + fs * 0.86;
    Array.from(text).forEach(function (ch, k) {
      out += '<text x="' + (x + w / 2).toFixed(2) + '" y="' + (y0 + k * fs).toFixed(2) + '" font-size="' + fs.toFixed(2) + '" text-anchor="middle">' + esc(ch) + '</text>';
    });
    return out;
  }

  function buildPrint() {
    var mode = state.printMode, n = cur.top.length, lad = cur.lad;
    var W = 190, colW = W / n;
    var tops = mode === 'blank' || (mode === 'fold' && !cur.fromNames) ? cur.top.map(function () { return ''; }) : cur.top;
    var bots = mode === 'blank' ? cur.bottom.map(function () { return ''; }) : cur.bottom;
    var needV = tops.concat(bots).some(function (t) { return t && Array.from(t).length * 3.2 > colW - 1.5; });
    var boxH = needV || mode !== 'full' ? 26 : 13;
    var foldGap = mode === 'fold' ? 18 : 3;
    var total = 246, ladH = total - boxH * 2 - foldGap - 6;
    var ladTop = boxH + 3, ladBot = ladTop + ladH, resTop = ladBot + foldGap;
    var s = '<svg xmlns="' + SVGNS + '" width="' + W + 'mm" height="' + total + 'mm" viewBox="0 0 ' + W + ' ' + total + '" font-family="Noto Sans JP, Hiragino Sans, Meiryo, sans-serif">';
    for (var c = 0; c < n; c++) {
      var x = c * colW, cx = x + colW / 2;
      s += '<rect x="' + (x + 0.8).toFixed(2) + '" y="0.5" width="' + (colW - 1.6).toFixed(2) + '" height="' + boxH + '" rx="1.5" fill="none" stroke="#000" stroke-width="0.35"/>';
      s += labelSvg(x + 0.8, 0.5, colW - 1.6, boxH, tops[c]);
      s += '<line x1="' + cx.toFixed(2) + '" x2="' + cx.toFixed(2) + '" y1="' + (boxH + 0.5) + '" y2="' + resTop.toFixed(2) + '" stroke="#000" stroke-width="0.6"/>';
      s += '<rect x="' + (x + 0.8).toFixed(2) + '" y="' + resTop.toFixed(2) + '" width="' + (colW - 1.6).toFixed(2) + '" height="' + boxH + '" rx="1.5" fill="none" stroke="#000" stroke-width="0.35"/>';
      s += labelSvg(x + 0.8, resTop, colW - 1.6, boxH, bots[c]);
    }
    lad.rungs.forEach(function (r) {
      var y = ladTop + 3 + r.y * (ladH - 6);
      s += '<line x1="' + ((r.g + 0.5) * colW).toFixed(2) + '" x2="' + ((r.g + 1.5) * colW).toFixed(2) + '" y1="' + y.toFixed(2) + '" y2="' + y.toFixed(2) + '" stroke="#000" stroke-width="0.6"/>';
    });
    if (mode === 'fold') {
      var fy = resTop - foldGap / 2;
      s += '<line x1="0" x2="' + W + '" y1="' + fy + '" y2="' + fy + '" stroke="#000" stroke-width="0.3" stroke-dasharray="2 1.5"/>';
      s += '<text x="' + (W / 2) + '" y="' + (fy - 1.2) + '" font-size="3" text-anchor="middle">✂ この線で裏へ折って、下の結果を隠す</text>';
    }
    s += '</svg>';
    var area = $('print-area');
    area.innerHTML = (cur.title ? '<h1 class="p-title">' + esc(cur.title) + '</h1>' : '') + s +
      (mode === 'blank' ? '<p class="p-note">上に名前、下に結果を書いてから使います。</p>' : '') +
      (state.credit ? '<p class="p-credit">yorozu-craft.com/web-roulette/print/ で作成</p>' : '');
  }

  function doPrint() {
    buildPrint();
    document.body.classList.add('has-print');
    var off = function () { document.body.classList.remove('has-print'); window.removeEventListener('afterprint', off); };
    window.addEventListener('afterprint', off);
    window.print();
  }

  // ---------------------------------------------------------------
  // 入力と画面をつなぐ
  // ---------------------------------------------------------------
  function kindValue() { return state.kind === 'atari' ? 'atari' + Math.min(3, state.atari) : state.kind; }
  function fillInputs() {
    $('names').value = state.names;
    $('count').value = state.count;
    $('kind').value = kindValue();
    $('custom').value = state.custom;
    $('custom-field').hidden = state.kind !== 'custom';
    $('density').value = state.density;
    $('hide-rungs').checked = state.hide;
    $('title').value = state.title;
    document.querySelector('input[name="pmode"][value="' + state.printMode + '"]').checked = true;
    $('print-credit').checked = state.credit;
  }
  function readInputs() {
    state.names = $('names').value;
    state.count = A.normalizeState({ count: $('count').value }).count;
    var k = $('kind').value;
    if (/^atari/.test(k)) { state.kind = 'atari'; state.atari = Number(k.slice(5)); } else state.kind = k;
    state.custom = $('custom').value;
    $('custom-field').hidden = state.kind !== 'custom';
    state.density = $('density').value;
    state.hide = $('hide-rungs').checked;
  }

  var timer = null;
  ['names', 'count', 'custom'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { readInputs(); save(); refresh(false); }, 300);
    });
  });
  ['kind', 'density', 'hide-rungs'].forEach(function (id) {
    $(id).addEventListener('change', function () { readInputs(); save(); refresh(false); });
  });
  $('title').addEventListener('input', function () { state.title = A.normalizeState({ title: $('title').value }).title; if (!shared) cur.title = state.title; save(); });
  document.querySelectorAll('input[name="pmode"]').forEach(function (r) {
    r.addEventListener('change', function () { state.printMode = r.value; save(); summaries(); });
  });
  $('print-credit').addEventListener('change', function () { state.credit = $('print-credit').checked; save(); });

  $('reveal-all').addEventListener('click', function () {
    allShown = true;
    for (var i = 0; i < cur.top.length; i++) if (revealed.indexOf(i) < 0) revealed.push(i);
    renderLadder();
  });
  $('reroll').addEventListener('click', function () {
    state.seed = newSeed(); save(); refresh(false);
  });
  $('print').addEventListener('click', doPrint);

  $('share').addEventListener('click', function () {
    var hash = A.encodeShare(cur.top, cur.results, cur.seed, shared ? shared.density : state.density, cur.title);
    var url = location.href.split('#')[0] + '#s=' + hash, msg = $('share-msg'), box = $('share-url');
    box.value = url; box.hidden = false;
    var done = function () { msg.textContent = 'コピーしました。LINE などに貼り付けて送れます。'; };
    var fail = function () { msg.textContent = 'コピーできませんでした。下のリンクを長押ししてコピーしてください。'; box.select(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, fail); else fail();
  });

  // ファイルへの書き出し・読み込み（README「ツールを追加するとき」20。ルーレットの候補も一緒に書き出す）
  function readRaw(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : undefined; } catch (e) { return undefined; } }
  $('backup-export').addEventListener('click', function () {
    // ルーレットの保存があるときだけ一緒に入れる（無いのに空で入れると、ルーレット側で読み込んだとき候補が消える）
    var data = { amida: state };
    Object.keys(ROULETTE_KEYS).forEach(function (k) { var v = readRaw(ROULETTE_KEYS[k]); if (v !== undefined) data[k] = v; });
    var blob = new Blob([JSON.stringify(B.buildBackup(TOOL, data), null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = B.backupFileName(TOOL);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    $('backup-msg').textContent = data.candidates ? 'ファイルに書き出しました（ルーレットの候補も入っています）。' : 'ファイルに書き出しました。';
  });
  $('backup-import').addEventListener('click', function () { $('backup-file').click(); });
  $('backup-file').addEventListener('change', function (e) {
    var file = e.target.files[0];
    $('backup-file').value = '';
    if (!file) return;
    if (file.size > 1024 * 1024) { $('backup-msg').textContent = 'ファイルが大きすぎます。このツールで書き出したファイルを選んでください。'; return; }
    var reader = new FileReader();
    reader.onload = function () {
      var r = B.parseBackup(reader.result, TOOL, ['amida']);
      if (!r.ok) { $('backup-msg').textContent = r.error; return; }
      if (!window.confirm('ファイルの内容で、今のあみだくじの入力を置き換えます。よろしいですか？')) return;
      state = A.normalizeState(r.data.amida);
      if (!state.seed) state.seed = newSeed();
      save(); fillInputs(); refresh(false);
      $('backup-msg').textContent = 'ファイルから読み込みました。';
    };
    reader.onerror = function () { $('backup-msg').textContent = 'ファイルを読み取れませんでした。'; };
    reader.readAsText(file);
  });

  var lastW = 0;
  window.addEventListener('resize', function () {
    var w = $('ladder').parentNode.clientWidth;
    if (w === lastW) return;
    lastW = w;
    clearTimeout(timer);
    timer = setTimeout(function () { renderLadder(); }, 150);
  });

  // --- 読み込み時 ---
  if (/^#s=/.test(location.hash) && !shared) {
    $('shared-banner').hidden = false;
    $('shared-msg').textContent = 'リンクを読み取れませんでした。送ってくれた人に、もう一度送ってもらってください。';
  }
  if (shared) {
    $('shared-banner').hidden = false;
    $('inputs').hidden = true;
    $('opt-lines').hidden = true;
    $('reroll').hidden = true;
    if (shared.title) $('h-result').textContent = shared.title;
  }
  fillInputs();
  if (shared) $('title').value = shared.title;
  refresh(false);
  lastW = $('ladder').parentNode.clientWidth;
})();
