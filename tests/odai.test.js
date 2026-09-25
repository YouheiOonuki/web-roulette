// お題の一覧のテスト: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { LISTS, byId } = require('../odai.js');

test('一覧: id は重ならず、英小文字とハイフンだけ', () => {
  const ids = LISTS.map(l => l.id);
  assert.equal(new Set(ids).size, ids.length);
  ids.forEach(id => assert.match(id, /^[a-z-]+$/));
  assert.equal(byId('osama-kids').title, '王様ゲームの命令（子ども向け・おだやか）');
  assert.equal(byId('nothing'), null);
});

test('お題: 各一覧の中で重ならない・空でない・40 字まで・遊びの一覧は 20 個以上', () => {
  LISTS.forEach(l => {
    assert.equal(new Set(l.items).size, l.items.length, l.id);
    l.items.forEach(x => { assert.ok(x.trim() && x === x.trim(), l.id + ':' + x); assert.ok(x.length <= 40, x); });
    if (l.who !== '小道具') assert.ok(l.items.length >= 20, l.id + ' ' + l.items.length);
  });
});

test('載せないことば（恋愛・体にふれる・秘密・診断・占いなど。D117）', () => {
  const NG = /恋|好きな人|告白|キス|ハグ|抱き|手をつな|ほっぺ|頭ぽんぽん|壁ドン|ポッキー|秘密を|ひみつを|暴露|体重|年収|診断|占い|運勢|相性|お酒|ビール|一気|罰金|おごる|痛い|しっぺ|デコピン|くすぐ/;
  // 注意書き（note）は「入れていません」と書くので、題とお題だけを見る
  LISTS.forEach(l => [l.title].concat(l.items).forEach(x => assert.doesNotMatch(x, NG, l.id + ': ' + x)));
});

test('小道具の一覧: サイコロ 1〜6・コイン・じゃんけん', () => {
  assert.deepEqual(byId('dice').items, ['1', '2', '3', '4', '5', '6']);
  assert.deepEqual(byId('coin').items, ['表', '裏']);
  assert.deepEqual(byId('janken').items, ['グー', 'チョキ', 'パー']);
});

test('一覧ページ（odai/index.html）が odai.js と一致している（tools/build-odai.cjs を実行し忘れていない）', () => {
  const fs = require('node:fs'), path = require('node:path');
  const { render, START, END } = require('../tools/build-odai.cjs');
  const html = fs.readFileSync(path.join(__dirname, '..', 'odai', 'index.html'), 'utf8');
  const inner = html.slice(html.indexOf(START) + START.length, html.indexOf(END)).trim();
  assert.equal(inner, render().trim());
});
