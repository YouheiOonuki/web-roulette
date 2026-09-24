// ===========================
// ルーレット / くじ引きアプリ - backup.js
// 保存内容のファイルへの書き出し・読み込み（youheioonuki.github.io の README「ツールを追加するとき」20。決定 D31）
// DOM や localStorage に触らない純粋関数。tests/backup.test.js から node --test で確かめる
// ブラウザでは window.Backup、Node（テスト）では module.exports で使う
// ===========================

(function (root) {
  'use strict';

  // 形式: { tool, version, exportedAt, data }。data はブラウザに保存しているものと同じ形
  var BACKUP_VERSION = 1;
  var MAX_HISTORY = 10;

  /** 書き出すファイル名: <ツール名>-backup-YYYYMMDD.json（日付は端末の時計） */
  function backupFileName(tool, date) {
    var d = date || new Date();
    return tool + '-backup-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.json';
  }

  /** 書き出す中身 */
  function buildBackup(tool, data, date) {
    return { tool: tool, version: BACKUP_VERSION, exportedAt: (date || new Date()).toISOString(), data: data };
  }

  /**
   * 読み込んだファイルの文字列を確かめる
   * @returns {{ok: true, data: object} | {ok: false, error: string}} error は画面にそのまま出す文
   */
  function parseBackup(text, tool, requiredKeys) {
    var o;
    try { o = JSON.parse(text); } catch (e) { o = null; }
    if (!o || typeof o !== 'object' || Array.isArray(o) || typeof o.tool !== 'string') {
      return { ok: false, error: 'ファイルを読み取れませんでした。このツールの「ファイルに書き出す」で作った .json ファイルを選んでください。' };
    }
    if (o.tool !== tool) {
      return { ok: false, error: 'ほかのツール（' + o.tool.slice(0, 40) + '）のファイルです。このツールで書き出したファイルを選んでください。' };
    }
    if (o.version !== BACKUP_VERSION) {
      return { ok: false, error: typeof o.version === 'number' && o.version > BACKUP_VERSION
        ? '新しい版のツールで書き出したファイルのため読み込めません。ページを再読み込みしてから、もう一度お試しください。'
        : 'ファイルの形式が正しくないため読み込めません。' };
    }
    var data = o.data;
    var missing = !data || typeof data !== 'object' || Array.isArray(data) ||
      (requiredKeys || []).some(function (k) { return data[k] === undefined || data[k] === null; });
    if (missing) return { ok: false, error: 'ファイルの中身が足りないため読み込めません。' };
    return { ok: true, data: data };
  }

  /** 候補: 名前が空でないものだけ。重みは 1〜3（それ以外は 1） */
  function normalizeCandidates(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter(function (c) { return c && typeof c === 'object' && typeof c.name === 'string' && c.name.trim().length > 0; })
      .map(function (c) {
        var w = parseInt(c.weight, 10);
        return { name: c.name.trim(), weight: w >= 1 && w <= 3 ? w : 1 };
      });
  }

  /** 設定: base（今の設定）にあるキーで、型が同じ値だけ受け取る。テーマは選べるものだけ */
  function normalizeSettings(saved, base, themes) {
    var s = {};
    for (var key in base) {
      if (base.hasOwnProperty(key)) s[key] = base[key];
    }
    if (!saved || typeof saved !== 'object') return s;
    for (var k in s) {
      if (s.hasOwnProperty(k) && saved.hasOwnProperty(k) && typeof saved[k] === typeof s[k]) s[k] = saved[k];
    }
    if ((themes || []).indexOf(s.theme) < 0) s.theme = base.theme;
    return s;
  }

  /** 履歴: 文字列の name・time を持つものだけ、最新 10 件 */
  function normalizeHistory(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter(function (e) { return e && typeof e === 'object' && typeof e.name === 'string'; })
      .slice(0, MAX_HISTORY)
      .map(function (e) {
        return { name: e.name, count: parseInt(e.count, 10) || 1, time: typeof e.time === 'string' ? e.time : '' };
      });
  }

  var api = {
    backupFileName: backupFileName, buildBackup: buildBackup, parseBackup: parseBackup,
    normalizeCandidates: normalizeCandidates, normalizeSettings: normalizeSettings, normalizeHistory: normalizeHistory,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Backup = api;
})(this);
