// バックアップを読んだ中身の正規化など、この repo だけの確かめ。形の確かめは共通の本体（同じフォルダの backup.test.js。値は backup.values.json）にある（yorozu-plans 7.271）。
const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeCandidates, normalizeSettings, normalizeHistory } = require('../backup.js');

test('normalizeCandidates: 名前が空でないものだけ・重みは 1〜3', () => {
  const r = normalizeCandidates([{ name: ' カレー ', weight: 2 }, { name: '', weight: 1 }, { name: '寿司', weight: 9 }, { name: 3 }, null, '焼肉', { name: 'パスタ', weight: '3' }]);
  assert.deepEqual(r, [{ name: 'カレー', weight: 2 }, { name: '寿司', weight: 1 }, { name: 'パスタ', weight: 3 }]);
  assert.deepEqual(normalizeCandidates('カレー'), []);
});

test('normalizeSettings: 今の設定にあるキーで型が同じものだけ（保存に残る古い theme は受け取らない）', () => {
  const base = { animation: true, weightEnabled: false, historyEnabled: true };
  assert.deepEqual(normalizeSettings({ theme: 'mori', animation: 'no', weightEnabled: true, extra: 1 }, base),
    { animation: true, weightEnabled: true, historyEnabled: true });
  assert.deepEqual(normalizeSettings(null, base), base);
});

test('normalizeHistory: name が文字列のものだけ・10 件まで', () => {
  const list = [{ name: 'カレー', count: 1, time: '2026/9/24 10:00:00' }, { name: 5 }, null]
    .concat(Array.from({ length: 12 }, (_, i) => ({ name: 'n' + i })));
  const r = normalizeHistory(list);
  assert.equal(r.length, 10);
  assert.deepEqual(r[0], { name: 'カレー', count: 1, time: '2026/9/24 10:00:00' });
  assert.deepEqual(r[1], { name: 'n0', count: 1, time: '' });
});
