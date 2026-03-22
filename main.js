// ===========================
// ルーレット / くじ引きアプリ - main.js
// 複数選択対応版
// ===========================

(function () {
  'use strict';

  // --- 定数 ---
  var STORAGE_KEYS = {
    candidates: 'roulette_candidates',
    settings: 'roulette_settings',
    history: 'roulette_history',
  };

  var DEFAULT_CANDIDATES = ['カレー', 'ラーメン', '寿司', '焼肉', 'パスタ'];
  var MAX_HISTORY = 10;

  // --- DOM要素 ---
  var dom = {
    themeSelect: document.getElementById('theme-select'),
    animationToggle: document.getElementById('animation-toggle'),
    weightToggle: document.getElementById('weight-toggle'),
    historyToggle: document.getElementById('history-toggle'),
    testToggle: document.getElementById('test-toggle'),
    candidateInput: document.getElementById('candidate-input'),
    delimiter: document.getElementById('delimiter'),
    addBtn: document.getElementById('add-btn'),
    fileUpload: document.getElementById('file-upload'),
    resetBtn: document.getElementById('reset-btn'),
    presetBtn: document.getElementById('preset-btn'),
    candidateList: document.getElementById('candidate-list'),
    candidateCount: document.getElementById('candidate-count'),
    rouletteDisplay: document.getElementById('roulette-display'),
    rouletteText: document.getElementById('roulette-text'),
    resultDisplay: document.getElementById('result-display'),
    resultText: document.getElementById('result-text'),
    startBtn: document.getElementById('start-btn'),
    shuffleBtn: document.getElementById('shuffle-btn'),
    selectCount: document.getElementById('select-count'),
    selectCountMax: document.getElementById('select-count-max'),
    historySection: document.getElementById('history-section'),
    historyList: document.getElementById('history-list'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    debugSection: document.getElementById('debug-section'),
    debugLog: document.getElementById('debug-log'),
    clearDebugBtn: document.getElementById('clear-debug-btn'),
  };

  // --- 状態 ---
  var candidates = []; // { name: string, weight: number }[]
  var history = [];
  var settings = {
    theme: 'washi',
    animation: true,
    weightEnabled: false,
    historyEnabled: true,
    testMode: false,
  };
  var isSpinning = false;
  var testSeed = 42;

  // ===========================
  // ローカルストレージ
  // ===========================

  function saveCandidates() {
    localStorage.setItem(STORAGE_KEYS.candidates, JSON.stringify(candidates));
    debugLog('候補を保存: ' + candidates.length + '件');
  }

  function loadCandidates() {
    var data = localStorage.getItem(STORAGE_KEYS.candidates);
    if (data) {
      try {
        candidates = JSON.parse(data);
        debugLog('候補を読み込み: ' + candidates.length + '件');
      } catch (e) {
        candidates = [];
      }
    }
    return candidates.length > 0;
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  function loadSettings() {
    var data = localStorage.getItem(STORAGE_KEYS.settings);
    if (data) {
      try {
        var saved = JSON.parse(data);
        for (var key in saved) {
          if (saved.hasOwnProperty(key)) settings[key] = saved[key];
        }
      } catch (e) { /* ignore */ }
    }
  }

  function saveHistory() {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }

  function loadHistory() {
    var data = localStorage.getItem(STORAGE_KEYS.history);
    if (data) {
      try { history = JSON.parse(data); } catch (e) { history = []; }
    }
  }

  // ===========================
  // デバッグログ
  // ===========================

  function debugLog(msg) {
    if (!settings.testMode) return;
    var time = new Date().toLocaleTimeString('ja-JP');
    dom.debugLog.textContent += '[' + time + '] ' + msg + '\n';
    dom.debugLog.scrollTop = dom.debugLog.scrollHeight;
    console.log('[DEBUG]', msg);
  }

  // ===========================
  // 乱数
  // ===========================

  function seededRandom() {
    testSeed = (testSeed * 16807) % 2147483647;
    return (testSeed - 1) / 2147483646;
  }

  function getRandom() {
    if (settings.testMode) {
      var r = seededRandom();
      debugLog('乱数(シード): ' + r.toFixed(4));
      return r;
    }
    return Math.random();
  }

  // ===========================
  // 候補管理
  // ===========================

  function setPresetCandidates() {
    candidates = DEFAULT_CANDIDATES.map(function (name) {
      return { name: name, weight: 1 };
    });
    saveCandidates();
    renderCandidates();
    debugLog('プリセット候補をセット');
  }

  function parseText(text, delimiterType) {
    var sep;
    switch (delimiterType) {
      case 'comma': sep = ','; break;
      case 'semicolon': sep = ';'; break;
      default: sep = '\n';
    }
    return text.split(sep)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  function addCandidatesFromNames(names) {
    names.forEach(function (name) {
      candidates.push({ name: name, weight: 1 });
    });
    saveCandidates();
    renderCandidates();
    updateSelectCountMax();
    debugLog('候補を追加: ' + names.join(', '));
  }

  function removeCandidate(index) {
    var removed = candidates.splice(index, 1);
    saveCandidates();
    renderCandidates();
    updateSelectCountMax();
    debugLog('候補を削除: ' + (removed[0] ? removed[0].name : ''));
  }

  function updateWeight(index, weight) {
    if (candidates[index]) {
      candidates[index].weight = parseInt(weight, 10);
      saveCandidates();
      debugLog('重み変更: ' + candidates[index].name + ' → ' + weight);
    }
  }

  // 選択数の上限を更新
  function updateSelectCountMax() {
    var max = candidates.length || 1;
    dom.selectCount.max = max;
    dom.selectCountMax.textContent = '/ ' + candidates.length + '件';
    // 現在値が上限を超えていたら補正
    if (parseInt(dom.selectCount.value, 10) > max) {
      dom.selectCount.value = max;
    }
  }

  // ===========================
  // 候補一覧の描画
  // ===========================

  function renderCandidates() {
    dom.candidateList.innerHTML = '';
    dom.candidateCount.textContent = candidates.length;

    if (settings.weightEnabled) {
      dom.candidateList.classList.add('weight-enabled');
    } else {
      dom.candidateList.classList.remove('weight-enabled');
    }

    if (candidates.length === 0) {
      var li = document.createElement('li');
      li.className = 'candidate-empty';
      li.textContent = '候補がありません。下の入力欄から追加してください。';
      dom.candidateList.appendChild(li);
      return;
    }

    candidates.forEach(function (c, i) {
      var li = document.createElement('li');
      li.className = 'candidate-item';
      li.setAttribute('data-index', i);

      var info = document.createElement('div');
      info.className = 'candidate-info';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'candidate-name';
      nameSpan.textContent = c.name;
      info.appendChild(nameSpan);

      // 重み付けUI
      var weightSpan = document.createElement('span');
      weightSpan.className = 'candidate-weight';
      var wLabel = document.createElement('span');
      wLabel.textContent = '重み:';
      var wSelect = document.createElement('select');
      [1, 2, 3].forEach(function (w) {
        var opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        if (c.weight === w) opt.selected = true;
        wSelect.appendChild(opt);
      });
      wSelect.addEventListener('change', function () {
        updateWeight(i, this.value);
      });
      weightSpan.appendChild(wLabel);
      weightSpan.appendChild(wSelect);
      info.appendChild(weightSpan);

      li.appendChild(info);

      var delBtn = document.createElement('button');
      delBtn.className = 'candidate-delete';
      delBtn.textContent = '✕';
      delBtn.title = '削除';
      delBtn.addEventListener('click', function () { removeCandidate(i); });
      li.appendChild(delBtn);

      dom.candidateList.appendChild(li);
    });
  }

  // ===========================
  // 複数選択ランダムピック（重み付き対応）
  // ===========================

  function weightedRandomPickMultiple(count) {
    if (candidates.length === 0) return [];
    var n = Math.min(count, candidates.length);

    // 残り候補をコピー（元のインデックスを保持）
    var remaining = candidates.map(function (c, i) {
      return { name: c.name, weight: c.weight, originalIndex: i };
    });

    var results = [];

    for (var r = 0; r < n; r++) {
      var picked;

      if (!settings.weightEnabled) {
        // 均等選択
        var idx = Math.floor(getRandom() * remaining.length);
        picked = remaining[idx];
        remaining.splice(idx, 1);
      } else {
        // 重み付き選択
        var pool = [];
        remaining.forEach(function (c, i) {
          for (var w = 0; w < c.weight; w++) pool.push(i);
        });
        var poolIdx = Math.floor(getRandom() * pool.length);
        var remIdx = pool[poolIdx];
        picked = remaining[remIdx];
        remaining.splice(remIdx, 1);
      }

      results.push({
        index: picked.originalIndex,
        candidate: { name: picked.name, weight: picked.weight }
      });
    }

    return results;
  }

  // ===========================
  // ルーレット演出
  // ===========================

  // ハイライト(アニメ用)をクリア。lockedは残す
  function clearAnimHighlights() {
    var items = dom.candidateList.querySelectorAll('.candidate-item.highlight');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove('highlight');
    }
  }

  // 全ハイライト(locked含む)をクリア
  function clearAllHighlights() {
    var items = dom.candidateList.querySelectorAll('.candidate-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove('highlight');
      items[i].classList.remove('locked');
    }
  }

  // 演出なし：即時選択
  function instantPick() {
    var count = getSelectCount();
    var results = weightedRandomPickMultiple(count);
    if (results.length === 0) return;

    showResults(results);
    addHistoryEntry(results);

    // ハイライト
    clearAllHighlights();
    results.forEach(function (r) {
      var items = dom.candidateList.querySelectorAll('.candidate-item');
      if (items[r.index]) items[r.index].classList.add('locked');
    });

    debugLog('即時選択: ' + results.map(function (r) { return r.candidate.name; }).join(', '));
  }

  // 演出あり：ドキドキルーレット（複数選択対応）
  function animatedPick() {
    var count = getSelectCount();
    var results = weightedRandomPickMultiple(count);
    if (results.length === 0) return;

    isSpinning = true;
    dom.startBtn.disabled = true;
    dom.shuffleBtn.disabled = true;
    dom.resultDisplay.classList.add('hidden');
    dom.rouletteDisplay.classList.remove('decided');
    clearAllHighlights();

    var lockedIndices = {}; // 確定済みインデックスのセット
    var roundIdx = 0;

    debugLog('演出開始: ' + count + '個選択, 結果=[' +
      results.map(function (r) { return r.candidate.name; }).join(', ') + ']');

    function runRound() {
      if (roundIdx >= results.length) {
        // 全ラウンド完了
        finishMultiRoulette(results);
        return;
      }

      var target = results[roundIdx];
      dom.rouletteDisplay.classList.add('spinning');

      // アニメ対象：locked でない候補のみ
      var available = [];
      candidates.forEach(function (c, i) {
        if (!lockedIndices[i]) {
          available.push({ candidate: c, originalIndex: i });
        }
      });

      if (available.length === 0) {
        finishMultiRoulette(results);
        return;
      }

      // 最後のステップが target に止まるよう totalSteps を調整
      var targetAvailIdx = -1;
      for (var a = 0; a < available.length; a++) {
        if (available[a].originalIndex === target.index) {
          targetAvailIdx = a;
          break;
        }
      }

      var minSteps = settings.testMode ? 8 : 15;
      var remainder = minSteps % available.length;
      var totalSteps = minSteps +
        ((targetAvailIdx - remainder + available.length) % available.length);

      var currentStep = 0;

      function step() {
        clearAnimHighlights();

        var curAvailIdx = currentStep % available.length;
        var curOrigIdx = available[curAvailIdx].originalIndex;

        var items = dom.candidateList.querySelectorAll('.candidate-item');
        if (items[curOrigIdx]) {
          items[curOrigIdx].classList.add('highlight');
        }

        dom.rouletteText.textContent = available[curAvailIdx].candidate.name;
        currentStep++;

        if (currentStep <= totalSteps) {
          var baseInterval = settings.testMode ? 15 : 40;
          var progress = currentStep / totalSteps;
          var interval = baseInterval + Math.pow(progress, 2) * 350;
          setTimeout(step, interval);
        } else {
          // このラウンドの確定処理
          clearAnimHighlights();
          lockedIndices[target.index] = true;

          var items2 = dom.candidateList.querySelectorAll('.candidate-item');
          if (items2[target.index]) {
            items2[target.index].classList.add('locked');
          }

          // 中間結果表示（確定済みの分だけ渡す）
          showPartialResults(results.slice(0, roundIdx + 1));

          roundIdx++;

          // 次のラウンドまで少し間を置く
          var pause = settings.testMode ? 150 : 500;
          setTimeout(runRound, pause);
        }
      }

      step();
    }

    runRound();
  }

  function finishMultiRoulette(results) {
    dom.rouletteDisplay.classList.remove('spinning');
    dom.rouletteDisplay.classList.add('decided');

    if (results.length === 1) {
      dom.rouletteText.textContent = results[0].candidate.name;
    } else {
      dom.rouletteText.textContent = results.length + '個を選択しました！';
    }

    showResults(results);
    addHistoryEntry(results);

    isSpinning = false;
    dom.startBtn.disabled = false;
    dom.shuffleBtn.disabled = false;

    debugLog('演出終了');
  }

  // 中間結果表示（確定済みの結果のみ表示）
  function showPartialResults(confirmedResults) {
    dom.resultDisplay.classList.remove('hidden');

    if (confirmedResults.length === 1) {
      dom.resultText.className = 'result-text';
      dom.resultText.textContent = confirmedResults[0].candidate.name;
      return;
    }

    dom.resultText.className = 'result-text multi';
    dom.resultText.innerHTML = '';

    for (var i = 0; i < confirmedResults.length; i++) {
      var span = document.createElement('span');
      span.className = 'result-item';
      span.textContent = (i + 1) + '. ' + confirmedResults[i].candidate.name;
      dom.resultText.appendChild(span);
    }
  }

  // 最終結果表示
  function showResults(results) {
    dom.resultDisplay.classList.remove('hidden');

    if (results.length === 1) {
      dom.resultText.className = 'result-text';
      dom.resultText.textContent = results[0].candidate.name;
      return;
    }

    dom.resultText.className = 'result-text multi';
    dom.resultText.innerHTML = '';

    results.forEach(function (r, i) {
      var span = document.createElement('span');
      span.className = 'result-item';
      span.textContent = (i + 1) + '. ' + r.candidate.name;
      dom.resultText.appendChild(span);
    });
  }

  // 選択数を取得
  function getSelectCount() {
    var val = parseInt(dom.selectCount.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > candidates.length) val = candidates.length;
    return val;
  }

  // ===========================
  // シャッフルモード
  // ===========================

  function shuffleCandidates() {
    if (candidates.length < 2) return;
    for (var i = candidates.length - 1; i > 0; i--) {
      var j = Math.floor(getRandom() * (i + 1));
      var temp = candidates[i];
      candidates[i] = candidates[j];
      candidates[j] = temp;
    }
    saveCandidates();
    renderCandidates();
    debugLog('シャッフル実行');
  }

  // ===========================
  // 履歴
  // ===========================

  function addHistoryEntry(results) {
    if (!settings.historyEnabled) return;

    var names = results.map(function (r) { return r.candidate.name; }).join(', ');
    var entry = {
      name: names,
      count: results.length,
      time: new Date().toLocaleString('ja-JP'),
    };

    history.unshift(entry);
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }

    saveHistory();
    renderHistory();
    debugLog('履歴に追加: ' + names);
  }

  function renderHistory() {
    dom.historyList.innerHTML = '';

    if (!settings.historyEnabled) {
      dom.historySection.style.display = 'none';
      return;
    }
    dom.historySection.style.display = '';

    if (history.length === 0) {
      var li = document.createElement('li');
      li.className = 'history-empty';
      li.textContent = 'まだ履歴がありません';
      dom.historyList.appendChild(li);
      return;
    }

    history.forEach(function (entry) {
      var li = document.createElement('li');
      li.className = 'history-item';

      var nameSpan = document.createElement('span');
      nameSpan.textContent = entry.name;
      li.appendChild(nameSpan);

      var timeSpan = document.createElement('span');
      timeSpan.className = 'history-time';
      timeSpan.textContent = entry.time;
      li.appendChild(timeSpan);

      dom.historyList.appendChild(li);
    });
  }

  // ===========================
  // テーマ
  // ===========================

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    settings.theme = theme;
    saveSettings();
    debugLog('テーマ変更: ' + theme);
  }

  // ===========================
  // 設定の反映
  // ===========================

  function applySettings() {
    dom.themeSelect.value = settings.theme;
    dom.animationToggle.checked = settings.animation;
    dom.weightToggle.checked = settings.weightEnabled;
    dom.historyToggle.checked = settings.historyEnabled;
    dom.testToggle.checked = settings.testMode;

    applyTheme(settings.theme);

    if (settings.testMode) {
      dom.debugSection.classList.remove('hidden');
    } else {
      dom.debugSection.classList.add('hidden');
    }

    if (settings.historyEnabled) {
      dom.historySection.style.display = '';
    } else {
      dom.historySection.style.display = 'none';
    }
  }

  // ===========================
  // イベントリスナー
  // ===========================

  function setupEventListeners() {
    dom.themeSelect.addEventListener('change', function () {
      applyTheme(this.value);
    });

    dom.animationToggle.addEventListener('change', function () {
      settings.animation = this.checked;
      saveSettings();
      debugLog('演出: ' + (settings.animation ? 'ON' : 'OFF'));
    });

    dom.weightToggle.addEventListener('change', function () {
      settings.weightEnabled = this.checked;
      saveSettings();
      renderCandidates();
      debugLog('重み付け: ' + (settings.weightEnabled ? 'ON' : 'OFF'));
    });

    dom.historyToggle.addEventListener('change', function () {
      settings.historyEnabled = this.checked;
      saveSettings();
      renderHistory();
      debugLog('履歴: ' + (settings.historyEnabled ? 'ON' : 'OFF'));
    });

    dom.testToggle.addEventListener('change', function () {
      settings.testMode = this.checked;
      saveSettings();
      if (settings.testMode) {
        dom.debugSection.classList.remove('hidden');
        testSeed = 42;
        debugLog('テストモード有効');
      } else {
        dom.debugSection.classList.add('hidden');
      }
    });

    dom.addBtn.addEventListener('click', function () {
      var text = dom.candidateInput.value;
      if (!text.trim()) return;
      var names = parseText(text, dom.delimiter.value);
      if (names.length > 0) {
        addCandidatesFromNames(names);
        dom.candidateInput.value = '';
      }
    });

    dom.fileUpload.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (event) {
        var text = event.target.result;
        var names = parseText(text, dom.delimiter.value);
        if (names.length > 0) {
          addCandidatesFromNames(names);
          debugLog('ファイル読み込み: ' + file.name + ' (' + names.length + '件)');
        }
        dom.fileUpload.value = '';
      };
      reader.readAsText(file, 'UTF-8');
    });

    dom.resetBtn.addEventListener('click', function () {
      if (confirm('候補をすべて削除しますか？')) {
        candidates = [];
        saveCandidates();
        renderCandidates();
        updateSelectCountMax();
        dom.resultDisplay.classList.add('hidden');
        dom.rouletteText.textContent = 'スタートを押してください';
        debugLog('候補をリセット');
      }
    });

    dom.presetBtn.addEventListener('click', function () {
      setPresetCandidates();
      updateSelectCountMax();
      dom.resultDisplay.classList.add('hidden');
      dom.rouletteText.textContent = 'スタートを押してください';
    });

    dom.startBtn.addEventListener('click', function () {
      if (isSpinning) return;
      if (candidates.length === 0) {
        alert('候補がありません。候補を追加してください。');
        return;
      }

      dom.resultDisplay.classList.add('hidden');
      clearAllHighlights();

      if (settings.animation) {
        animatedPick();
      } else {
        instantPick();
      }
    });

    dom.shuffleBtn.addEventListener('click', function () {
      if (isSpinning) return;
      if (candidates.length < 2) {
        alert('シャッフルには2つ以上の候補が必要です。');
        return;
      }
      shuffleCandidates();
    });

    dom.clearHistoryBtn.addEventListener('click', function () {
      history = [];
      saveHistory();
      renderHistory();
      debugLog('履歴をクリア');
    });

    dom.clearDebugBtn.addEventListener('click', function () {
      dom.debugLog.textContent = '';
    });

    dom.candidateInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && dom.delimiter.value !== 'newline' && !e.shiftKey) {
        e.preventDefault();
        dom.addBtn.click();
      }
    });
  }

  // ===========================
  // 初期化
  // ===========================

  function init() {
    loadSettings();
    applySettings();

    var hasData = loadCandidates();
    if (!hasData) {
      setPresetCandidates();
    }

    loadHistory();

    renderCandidates();
    renderHistory();
    updateSelectCountMax();

    setupEventListeners();
    debugLog('アプリ初期化完了');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
