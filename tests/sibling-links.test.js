// ほかの道具への並び（Q-354）: 区切りは字（・）でなく間隔。折れても行が「・」から始まらない
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('ルーレットとサイコロの並びは ul・li で、li の外に区切りの字を置かない', () => {
  for (const [file, n] of [['index.html', 7], ['dice/index.html', 3]]) {
    const ul = /<ul class="sibling-links[^"]*">([\s\S]*?)<\/ul>/.exec(read(file));
    assert.ok(ul, `${file} に並びがある`);
    assert.equal((ul[1].match(/<li><a href="[^"]+">[^<]+<\/a><\/li>/g) || []).length, n, `${file} の項目の数`);
    assert.equal(ul[1].replace(/<li>[\s\S]*?<\/li>/g, '').trim(), '', `${file}: li の外に字が無い`);
  }
  const css = read('style.css');
  assert.match(css, /\.sibling-links \{[^}]*display: flex;[^}]*gap: var\(--sp-2\) var\(--sp-4\)/, '行の間 8px・項目の間 16px');
  assert.match(css, /\.sibling-links a \{[^}]*min-height: var\(--tap\)/, '押す所 44px');
});

// 型 A（yorozu-plans D896・Q-1138）: あみだの使い方の <main> の最初の段落は答えの文。「▶ あみだくじを作る」はその後ろ
test('あみだの使い方: 最初の段落は答えの文、リンクはその後ろ', () => {
  const main = read('amida/guide.html').split('<main')[1];
  const first = main.match(/<p[^>]*>([\s\S]*?)<\/p>/)[1];
  assert.equal(first, '参加する人を 1 行に 1 人ずつ入れると、あみだくじになります。先に全員の結果を公平に決めてから横線を引くので、横線の本数で結果が偏りません。');
  assert.ok(main.indexOf(first) < main.indexOf('▶ あみだくじを作る'));
});
