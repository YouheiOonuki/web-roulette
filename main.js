// ===========================
// ルーレット / くじ引きアプリ - main.js
// ===========================

(function () {
  'use strict';

  // --- 定数 ---
  const STORAGE_KEYS = {
    candidates: 'roulette_candidates',
    settings: 'roulette_settings',
    history: 'roulette_history',
  };

  const DEFAULT_CANDIDATES = ['カレー', 'ラーメン', '寿司', '焼肉', 'パスタ'];
  const MAX_HISTORY = 10;

  // --- DOM要素 ---
  const dom = {
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
    historySection: document.getElementById('history-section'),
    historyList: document.getElementById('history-list'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    debugSection: document.getElementById('debug-section'),
    debugLog: document.getElementById('debug-log'),
    clearDebugBtn: document.getElementById('clear-debug-btn'),
  };

  // --- 状態 ---
  let candidates = []; // { name: string, weight: number }[]
  let history = [];
  let settings = {
    theme: 'dark',
    animation: true,
    weightEnabled: false,
    historyEnabled: true,
    testMode: false,
  };
  let isSpinning = false; // ルーレット回転中フラグ
  let testSeed = 42; // テストモード用シード

  // ===========================
  // ローカルストレージ
  // ===========================

  /** 候補を保存 */
  function saveCandidates() {
    localStorage.setItem(STORAGE_KEYS.candidates, JSON.stringify(candidates));
    debugLog('候補を保存: ' + candidates.length + '件');
  }

  /** 候補を読み込み */
  function loadCandidates() {
    const data = localStorage.getItem(STORAGE_KEYS.candidates);
    if (data) {
      try {
        candidates = JSON.parse(data);
        debugLog('候補を読み込み: ' + candidates.length + '件');
      } catch (e) {
        debugLog('候補の読み込みに失敗: ' + e.message);
        candidates = [];
      }
    }
    return candidates.length > 0;
  }

  /** 設定を保存 */
  function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  /** 設定を読み込み */
  function loadSettings() {
    const data = localStorage.getItem(STORAGE_KEYS.settings);
    if (data) {
      try {
        const saved = JSON.parse(data);
        settings = { ...settings, ...saved };
      } catch (e) {
        debugLog('設定の読み込みに失敗');
      }
    }
  }

  /** 履歴を保存 */
  function saveHistory() {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }

  /** 履歴を読み込み */
  function loadHistory() {
    const data = localStorage.getItem(STORAGE_KEYS.history);
    if (data) {
      try {
        history = JSON.parse(data);
      } catch (e) {
        history = [];
      }
    }
  }

  // ===========================
  // デバッグログ
  // ===========================

  /** デバッグメッセージを追加 */
  function debugLog(msg) {
    if (!settings.testMode) return;
    const time = new Date().toLocaleTimeString('ja-JP');
    const line = '[' + time + '] ' + msg + '\n';
    dom.debugLog.textContent += line;
    dom.debugLog.scrollTop = dom.debugLog.scrollHeight;
    console.log('[DEBUG]', msg);
  }

  // ===========================
  // 候補管理
  // ===========================

  /** プリセット候補をセット */
  function setPresetCandidates() {
    candidates = DEFAULT_CANDIDATES.map(function (name) {
      return { name: name, weight: 1 };
    });
    saveCandidates();
    renderCandidates();
    debugLog('プリセット候補をセット');
  }

  /** テキストを区切り文字でパース */
  function parseText(text, delimiterType) {
    var separator;
    switch (delimiterType) {
      case 'comma':
        separator = ',';
        break;
      case 'semicolon':
        separator = ';';
        break;
      default:
        separator = '\n';
    }
    return text
      .split(separator)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  /** 候補を追加 */
  function addCandidates(names) {
    names.forEach(function (name) {
      candidates.push({ name: name, weight: 1 });
    });
    saveCandidates();
    renderCandidates();
    debugLog('候補を追加: ' + names.join(', '));
  }

  /** 候補を削除 */
  function removeCandidate(index) {
    var removed = candidates.splice(index, 1);
    saveCandidates();
    renderCandidates();
    debugLog('候補を削除: ' + (removed[0] ? removed[0].name : ''));
  }

  /** 候補の重みを変更 */
  function updateWeight(index, weight) {
    if (candidates[index]) {
      candidates[index].weight = parseInt(weight, 10);
      saveCandidates();
      debugLog('重み変更: ' + candidates[index].name + ' → ' + weight);
    }
  }

  // ===========================
  // 候補一覧の描画
  // ===========================

  /** 候補リストを描画 */
  function renderCandidates() {
    dom.candidateList.innerHTML = '';
    dom.candidateCount.textContent = candidates.length;

    // 重み付け表示の切り替え
    if (settings.weightEnabled) {
      dom.candidateList.classList.add('weight-enabled');
    } else {
      dom.candidateList.classList.remove('weight-enabled');
    }

    if (candidates.length === 0) {
      var li = document.createElement('li');
      li.className = 'candidate-empty';
      li.textContent = '候補がありません。入力してください。';
      dom.candidateList.appendChild(li);
      return;
    }

    candidates.forEach(function (c, i) {
      var li = document.createElement('li');
      li.className = 'candidate-item';
      li.setAttribute('data-index', i);

      // 候補情報
      var info = document.createElement('div');
      info.className = 'candidate-info';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'candidate-name';
      nameSpan.textContent = c.name;
      info.appendChild(nameSpan);

      // 重み付けUI
      var weightSpan = document.createElement('span');
      weightSpan.className = 'candidate-weight';
      var weightLabel = document.createElement('span');
      weightLabel.textContent = '重み:';
      var weightSelect = document.createElement('select');
      [1, 2, 3].forEach(function (w) {
        var opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        if (c.weight === w) opt.selected = true;
        weightSelect.appendChild(opt);
      });
      weightSelect.addEventListener('change', function () {
        updateWeight(i, this.value);
      });
      weightSpan.appendChild(weightLabel);
      weightSpan.appendChild(weightSelect);
      info.appendChild(weightSpan);

      li.appendChild(info);

      // 削除ボタン
      var delBtn = document.createElement('button');
      delBtn.className = 'candidate-delete';
      delBtn.textContent = '✕';
      delBtn.title = '削除';
      delBtn.addEventListener('click', function () {
        removeCandidate(i);
      });
      li.appendChild(delBtn);

      dom.candidateList.appendChild(li);
    });
  }

  // ===========================
  // ランダム選択（重み付き対応）
  // ===========================

  /** テストモード用の擬似乱数 */
  function seededRandom() {
    testSeed = (testSeed * 16807) % 2147483647;
    return (testSeed - 1) / 2147483646;
  }

  /** 乱数取得（テストモード対応） */
  function getRandom() {
    if (settings.testMode) {
      var r = seededRandom();
      debugLog('乱数(シード): ' + r.toFixed(4));
      return r;
    }
    return Math.random();
  }

  /** 重み付きランダム選択 */
  function weightedRandomPick() {
    if (candidates.length === 0) return null;

    if (!settings.weightEnabled) {
      // 重みなし：均等
      var idx = Math.floor(getRandom() * candidates.length);
      return { index: idx, candidate: candidates[idx] };
    }

    // 重み付き：重み分だけプールに追加
    var pool = [];
    candidates.forEach(function (c, i) {
      for (var w = 0; w < c.weight; w++) {
        pool.push(i);
      }
    });

    var pickedIdx = pool[Math.floor(getRandom() * pool.length)];
    return { index: pickedIdx, candidate: candidates[pickedIdx] };
  }

  // ===========================
  // ルーレット演出
  // ===========================

  /** 演出なし：即時選択 */
  function instantPick() {
    var result = weightedRandomPick();
    if (!result) return;

    showResult(result.candidate.name);
    addHistory(result.candidate.name);
    highlightCandidate(result.index);
    debugLog('即時選択: ' + result.candidate.name);
  }

  /** 演出あり：ドキドキルーレット */
  function animatedPick() {
    var result = weightedRandomPick();
    if (!result) return;

    isSpinning = true;
    dom.startBtn.disabled = true;
    dom.shuffleBtn.disabled = true;
    dom.resultDisplay.classList.add('hidden');
    dom.rouletteDisplay.classList.add('spinning');
    dom.rouletteDisplay.classList.remove('decided');

    var minSteps = settings.testMode ? 10 : 25; // テストモードは高速
    // totalStepsを調整して最後のステップが結果のインデックスに一致するようにする
    var remainder = minSteps % candidates.length;
    var targetRemainder = result.index;
    var totalSteps = minSteps + ((targetRemainder - remainder + candidates.length) % candidates.length);
    var currentStep = 0;

    debugLog('演出開始: 合計ステップ=' + totalSteps + ', 結果=' + result.candidate.name);

    function step() {
      // 前のハイライトを消す
      clearHighlights();

      // 現在の候補をハイライト
      var currentIndex = currentStep % candidates.length;
      var items = dom.candidateList.querySelectorAll('.candidate-item');
      if (items[currentIndex]) {
        items[currentIndex].classList.add('highlight');
      }

      // ルーレット表示を更新
      dom.rouletteText.textContent = candidates[currentIndex].name;

      currentStep++;

      if (currentStep <= totalSteps) {
        // 減速：後半ほど間隔が長くなる
        var baseInterval = settings.testMode ? 20 : 50;
        var progress = currentStep / totalSteps;
        var interval = baseInterval + Math.pow(progress, 2) * 450;
        setTimeout(step, interval);
      } else {
        // 最後のステップ：結果を表示（既に結果候補がハイライト済み）
        finishRoulette(result);
      }
    }

    step();
  }

  /** ルーレット終了処理 */
  function finishRoulette(result) {
    dom.rouletteDisplay.classList.remove('spinning');
    dom.rouletteDisplay.classList.add('decided');
    dom.rouletteText.textContent = result.candidate.name;
    showResult(result.candidate.name);
    addHistory(result.candidate.name);
    highlightCandidate(result.index);

    isSpinning = false;
    dom.startBtn.disabled = false;
    dom.shuffleBtn.disabled = false;

    debugLog('演出終了: ' + result.candidate.name);
  }

  /** 結果を表示 */
  function showResult(name) {
    dom.resultText.textContent = name;
    dom.resultDisplay.classList.remove('hidden');
  }

  /** 候補をハイライト */
  function highlightCandidate(index) {
    clearHighlights();
    var items = dom.candidateList.querySelectorAll('.candidate-item');
    if (items[index]) {
      items[index].classList.add('highlight');
    }
  }

  /** 全ハイライトを消す */
  function clearHighlights() {
    var items = dom.candidateList.querySelectorAll('.candidate-item.highlight');
    items.forEach(function (item) {
      item.classList.remove('highlight');
    });
  }

  // ===========================
  // シャッフルモード
  // ===========================

  /** Fisher-Yatesシャッフル */
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

  /** 履歴に追加 */
  function addHistory(name) {
    if (!settings.historyEnabled) return;

    var entry = {
      name: name,
      time: new Date().toLocaleString('ja-JP'),
    };

    history.unshift(entry);

    // 最大件数を超えたら削除
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }

    saveHistory();
    renderHistory();
    debugLog('履歴に追加: ' + name);
  }

  /** 履歴を描画 */
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
  // テーマ切り替え
  // ===========================

  /** テーマを適用 */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    settings.theme = theme;
    saveSettings();
    debugLog('テーマ変更: ' + theme);
  }

  // ===========================
  // 設定の反映
  // ===========================

  /** 設定をUIに反映 */
  function applySettings() {
    dom.themeSelect.value = settings.theme;
    dom.animationToggle.checked = settings.animation;
    dom.weightToggle.checked = settings.weightEnabled;
    dom.historyToggle.checked = settings.historyEnabled;
    dom.testToggle.checked = settings.testMode;

    applyTheme(settings.theme);

    // テストモードのデバッグセクション表示
    if (settings.testMode) {
      dom.debugSection.classList.remove('hidden');
    } else {
      dom.debugSection.classList.add('hidden');
    }

    // 履歴セクション表示
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
    // テーマ切り替え
    dom.themeSelect.addEventListener('change', function () {
      applyTheme(this.value);
    });

    // 演出ON/OFF
    dom.animationToggle.addEventListener('change', function () {
      settings.animation = this.checked;
      saveSettings();
      debugLog('演出: ' + (settings.animation ? 'ON' : 'OFF'));
    });

    // 重み付けON/OFF
    dom.weightToggle.addEventListener('change', function () {
      settings.weightEnabled = this.checked;
      saveSettings();
      renderCandidates();
      debugLog('重み付け: ' + (settings.weightEnabled ? 'ON' : 'OFF'));
    });

    // 履歴ON/OFF
    dom.historyToggle.addEventListener('change', function () {
      settings.historyEnabled = this.checked;
      saveSettings();
      renderHistory();
      debugLog('履歴: ' + (settings.historyEnabled ? 'ON' : 'OFF'));
    });

    // テストモードON/OFF
    dom.testToggle.addEventListener('change', function () {
      settings.testMode = this.checked;
      saveSettings();
      if (settings.testMode) {
        dom.debugSection.classList.remove('hidden');
        testSeed = 42; // シードリセット
        debugLog('テストモード有効');
      } else {
        dom.debugSection.classList.add('hidden');
      }
    });

    // 候補追加
    dom.addBtn.addEventListener('click', function () {
      var text = dom.candidateInput.value;
      if (!text.trim()) return;
      var names = parseText(text, dom.delimiter.value);
      if (names.length > 0) {
        addCandidates(names);
        dom.candidateInput.value = '';
      }
    });

    // ファイルアップロード
    dom.fileUpload.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function (event) {
        var text = event.target.result;
        var names = parseText(text, dom.delimiter.value);
        if (names.length > 0) {
          addCandidates(names);
          debugLog('ファイル読み込み: ' + file.name + ' (' + names.length + '件)');
        }
        // ファイル入力をリセット
        dom.fileUpload.value = '';
      };
      reader.readAsText(file, 'UTF-8');
    });

    // リセット
    dom.resetBtn.addEventListener('click', function () {
      if (confirm('候補をすべて削除しますか？')) {
        candidates = [];
        saveCandidates();
        renderCandidates();
        dom.resultDisplay.classList.add('hidden');
        dom.rouletteText.textContent = 'スタートを押してください';
        debugLog('候補をリセット');
      }
    });

    // プリセットに戻す
    dom.presetBtn.addEventListener('click', function () {
      setPresetCandidates();
      dom.resultDisplay.classList.add('hidden');
      dom.rouletteText.textContent = 'スタートを押してください';
    });

    // スタート
    dom.startBtn.addEventListener('click', function () {
      if (isSpinning) return;
      if (candidates.length === 0) {
        alert('候補がありません。候補を追加してください。');
        return;
      }

      dom.resultDisplay.classList.add('hidden');
      clearHighlights();

      if (settings.animation) {
        animatedPick();
      } else {
        instantPick();
      }
    });

    // シャッフル
    dom.shuffleBtn.addEventListener('click', function () {
      if (isSpinning) return;
      if (candidates.length < 2) {
        alert('シャッフルには2つ以上の候補が必要です。');
        return;
      }
      shuffleCandidates();
    });

    // 履歴クリア
    dom.clearHistoryBtn.addEventListener('click', function () {
      history = [];
      saveHistory();
      renderHistory();
      debugLog('履歴をクリア');
    });

    // デバッグログクリア
    dom.clearDebugBtn.addEventListener('click', function () {
      dom.debugLog.textContent = '';
    });

    // Enterキーで候補追加
    dom.candidateInput.addEventListener('keydown', function (e) {
      // 改行区切りの場合はEnterで追加しない（改行入力のため）
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
    // 設定を読み込み
    loadSettings();
    applySettings();

    // 候補を読み込み（なければプリセット）
    var hasData = loadCandidates();
    if (!hasData) {
      setPresetCandidates();
    }

    // 履歴を読み込み
    loadHistory();

    // UI描画
    renderCandidates();
    renderHistory();

    // イベントリスナー設定
    setupEventListeners();

    debugLog('アプリ初期化完了');
  }

  // DOMContentLoaded で初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
