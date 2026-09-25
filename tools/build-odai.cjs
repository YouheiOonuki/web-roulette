// お題の一覧ページ（odai/index.html）の <main> の中の一覧を odai.js から作り直す
// 使い方: node tools/build-odai.cjs（odai.js を直したら実行してコミットする。tests/odai.test.js が一致を確かめる）
const fs = require('fs');
const path = require('path');
const { LISTS } = require('../odai.js');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function render() {
  return LISTS.map(l => [
    `    <section class="card odai-card" id="${l.id}" aria-labelledby="h-${l.id}">`,
    `      <h2 id="h-${l.id}">${esc(l.title)} <small>${esc(l.who)}・${l.items.length} 個</small></h2>`,
    l.note ? `      <p class="hint">${esc(l.note)}</p>` : '',
    `      <p class="btn-row no-print"><a class="btn" href="../#odai=${l.id}">ルーレットで回す</a></p>`,
    `      <ol class="odai-list">`,
    ...l.items.map(x => `        <li>${esc(x)}</li>`),
    `      </ol>`,
    `    </section>`,
  ].filter(Boolean).join('\n')).join('\n\n');
}
const file = path.join(__dirname, '..', 'odai', 'index.html');
const START = '<!-- ODAI:START（tools/build-odai.cjs が作る。手で直さない） -->', END = '<!-- ODAI:END -->';
const html = fs.readFileSync(file, 'utf8');
const i = html.indexOf(START), j = html.indexOf(END);
if (i < 0 || j < 0) throw new Error('markers');
const out = html.slice(0, i + START.length) + '\n' + render() + '\n    ' + html.slice(j);
if (require.main === module) { fs.writeFileSync(file, out); console.log('odai/index.html を更新しました'); }
module.exports = { render, START, END };
