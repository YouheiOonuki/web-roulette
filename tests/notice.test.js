// スタート・シャッフルの知らせ（D578: alert で出さず、画面の中に同じ字で出す）のテスト: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../pick.js');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('buttonNotice: 候補 0 でスタートは前の alert と同じ字、1 つ以上なら空（消す）', () => {
  assert.equal(P.buttonNotice('start', 0), '候補がありません。候補を追加してください。');
  assert.equal(P.buttonNotice('start', 1), '');
});

test('buttonNotice: 候補 1 つでシャッフルは前の alert と同じ字、2 つ以上なら空（消す）', () => {
  assert.equal(P.buttonNotice('shuffle', 0), 'シャッフルには2つ以上の候補が必要です。');
  assert.equal(P.buttonNotice('shuffle', 1), 'シャッフルには2つ以上の候補が必要です。');
  assert.equal(P.buttonNotice('shuffle', 2), '');
});

test('main.js は alert を呼ばない。知らせは #roulette-error に出す', () => {
  const src = read('main.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
  assert.doesNotMatch(src, /\balert\s*\(/);
  assert.match(src, /getElementById\('roulette-error'\)/);
});

test('index.html: 知らせの置き場はボタンの行のすぐ後の p.field-error（role="alert"、空の間は hidden）', () => {
  const html = read('index.html');
  assert.match(html, /<\/div>\s*<\/div>\s*<p id="roulette-error" class="field-error" role="alert" hidden><\/p>/);
  const i = html.indexOf('id="shuffle-btn"'), j = html.indexOf('id="roulette-error"');
  assert.ok(i > 0 && j > i, 'シャッフルのボタンの後');
});
