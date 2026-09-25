# 無料ルーレット・くじ引き Web アプリ

完全ローカルで動作する「ルーレット / くじ引き」Web アプリです。
API を一切使用せず、HTML / CSS / JavaScript の静的サイトとして構築されています。

## 機能一覧

### 候補管理
- **手動入力**: テキストボックスから候補を追加（改行・カンマ・セミコロンで区切り可能）
- **ファイルアップロード**: `.txt` ファイルから候補を一括読み込み
- **候補一覧表示**: 削除ボタン付きリスト
- **プリセット**: 初回アクセス時にデフォルト候補（カレー、ラーメン、寿司、焼肉、パスタ）を自動セット

### ルーレット
- **複数選択対応**: 10個の候補から5個選ぶなど、選択数を自由に指定可能
- **演出 ON**: 候補が順番にハイライト → 減速 → 1つずつ確定する「ドキドキ演出」
- **演出 OFF**: 即時ランダム選択

### その他の機能
- **シャッフルモード**: 候補をランダムに並び替え
- **重み付け（ON/OFF）**: 各候補に 1〜3 の重みを設定可能
- **6種類のテーマ**: 和紙風 / 森 / 藍染 / ダーク / メタル / ネオンサイバー
- **履歴（ON/OFF）**: 過去10回の結果をローカル保存
- **キーボード操作**: 入力欄の外で Space / Enter を押すとスタート
- **テストモード（開発者向け）**: URL に `?debug=1` を付けたときだけ表示。乱数固定、アニメーション高速化、デバッグログ表示

### SEO・AdSense対応
- **SEO最適化**: meta description、Open Graph（共有用画像つき）、Twitter Card、JSON-LD構造化データ（WebApplication + FAQPage）
- **AdSense審査対応**: 使い方ガイド・FAQ、運営者情報・免責事項、プライバシーポリシー、全ページ共通のナビゲーション、sitemap.xml
- **広告**: 全ページの `<head>` の AdSense タグによる自動広告。空の広告枠は置かない

### あみだくじ・お題・小道具（2026-09-25 追加。yorozu-plans の企画書 31、K97・K98）
- **あみだくじ** `/web-roulette/amida/`: 名前（空なら人数）と結果（当たり 1〜3 本・順番・自分で書く）から作る。名前を押すと線をたどるアニメーション、全員の結果、A4 縦の印刷（名前と結果を入れる／結果を折って隠す／線だけ）、共有リンク（`#s=`、名前・結果・くじ番号）。2〜20 人
  - **偏らない作り方**: 先に「だれがどの列に着くか」の並びを n! 通りが同じ確率になるように決め（Fisher–Yates）、その並びを隣どうしの入れ替え（横線）に分けて描く。打ち消し合う 2 本の飾りの横線を足して混ぜる。結果を下のどの列に置くかもくじ。横線をでたらめに引く作り方は、縦 5 本・横 10 本で左はし→左はしが 33.6%（公平なら 20%）に偏る（`amida.js` の `naiveEndProbs` で計算。使い方ページ `amida/guide.html` に書いた数字）
  - 保存キー `web-roulette_amida`。書き出しのファイルはルーレットと同じ形で、`data.amida` に入る（どちらのページでも読み込める）
- **お題の一覧** `/web-roulette/odai/`: 山手線ゲーム（小学生／中学生〜）、子ども向けの王様ゲームの命令、やさしい罰ゲーム、川柳・俳句、お絵かき、トークテーマ、サイコロ・コイン・じゃんけん。中身は `odai.js` の 1 か所で、ページの一覧は `node tools/build-odai.cjs` で作り直す（テストが一致を確かめる）。ルーレットの「お題を読み込む」と `/web-roulette/#odai=<id>` で候補に入る。恋愛・体にふれる・診断・占いは載せない（テストで禁止語を確かめる）
- **サイコロ・数字** `/web-roulette/dice/`: サイコロ 1〜10 個（合計つき）、コイントス、4 桁・6 桁・1〜100・範囲の数字（重なりなしも）。`crypto.getRandomValues` と、割り切れない端を捨てる引き直しで、どの数も同じ確率（`dice.js`）
- 新しいページの見た目は `kit.css`（toban と同じ和紙色・ダークモード自動）と `screen.js`。ルーレット本体は今までどおり `style.css` の 6 テーマ
- 印刷のクレジットの着地ページ `print/`（noindex、sitemap に載せない）
- テスト: `node --test tests/*.test.js`（`.github/workflows/test.yml` で push のたびに実行）

## ファイル構成

```
web-roulette/
├── index.html            # メインHTML（SEOメタタグ・構造化データ含む）
├── style.css             # テーマ対応スタイルシート
├── main.js               # アプリケーションロジック
├── backup.js             # 候補・設定・履歴のファイルへの書き出し・読み込み（純粋関数）
├── tests/*.test.js       # backup.js・amida.js・odai.js・dice.js のテスト（node --test tests/*.test.js）
├── amida.js              # あみだくじのロジック（純粋関数）
├── amida/                # あみだくじのページ（index.html・amida-ui.js・guide.html）
├── odai.js               # お題の一覧（ルーレットと odai/ が読む）
├── odai/index.html       # お題の一覧ページ（一覧は tools/build-odai.cjs が作る）
├── dice.js               # サイコロ・コイン・数字（純粋関数）
├── dice/index.html       # サイコロ・数字のページ
├── print/index.html      # 印刷物のクレジットの着地ページ（noindex）
├── kit.css / screen.js   # 新しいページの共通 CSS・固定バーなどの部品（toban と同じもの）
├── tools/build-odai.cjs  # odai.js から odai/index.html の一覧を作る
├── guide.html            # 使い方ガイド・よくある質問
├── about.html            # yorozu-craft 共通の運営者情報（../about.html）へ移動する案内ページ
├── privacy-policy.html   # yorozu-craft 共通のプライバシーポリシー（../privacy-policy.html）へ移動する案内ページ
├── favicon.svg           # ファビコン
├── og-image.png          # SNS共有用画像（1200x630）
├── sitemap.xml           # サイトマップ
├── .gitignore            # 秘密情報・退避コピーの除外設定
└── README.md             # このファイル
```

## ローカルでの動作確認

```bash
# クローン
git clone https://github.com/YouheiOonuki/web-roulette.git
cd web-roulette

# ブラウザで開く
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux

# またはローカルサーバー
python -m http.server 8000
```

## 公開 URL と構成

公開 URL: **https://yorozu-craft.com/web-roulette/**

独自ドメイン `yorozu-craft.com` は、ユーザーサイト用リポジトリ `youheioonuki.github.io` に設定しています。
GitHub Pages の仕組みにより、Pages を有効にしたリポジトリは自動で `yorozu-craft.com/<リポジトリ名>/` で配信されます。
このリポジトリ自体には独自ドメインの設定（CNAME）は不要です。

- `robots.txt` は検索エンジンがドメイン直下のものしか読まないため、`youheioonuki.github.io` リポジトリ側で管理し、このツールの `sitemap.xml` をそこに登録しています。
- フッターの「yorozu-craft トップ」は相対パス `../` なので、ドメインが変わっても動きます。

### このリポジトリの Pages 設定
1. **Settings** → **Pages** を開く
2. **Source** を `Deploy from a branch`、**Branch** を `main` / `/ (root)` にして **Save**

## 広告について

広告は、全ページの `<head>` に入れた AdSense タグ（`google-adsense-account` のメタタグと `adsbygoogle.js`）による**自動広告**で表示されます。Google が自動で位置を決めるので、空の広告枠は置いていません。

広告の位置を自分で指定したくなった場合は、`index.html` と `guide.html` のフッター内にある次のコメントの位置に、AdSense で作った広告ユニットのコードを入れてください。

```html
<!-- AD_PLACEHOLDER: 広告の位置を指定する場合はここに AdSense の広告ユニットを入れる（今は全ページの <head> のタグによる自動広告） -->
```

## AdSense 審査対策チェックリスト

- [x] プライバシーポリシー・運営者情報・免責事項（yorozu-craft 共通ページ `../privacy-policy.html` / `../about.html`）
- [ ] お問い合わせ窓口（現在は未設置。審査で求められたら追加）
- [x] 全ページ共通のナビゲーション
- [x] 十分なテキストコンテンツ（使い方ガイド + FAQ）
- [x] sitemap.xml（robots.txt はドメイン直下で管理）
- [x] 独自ドメイン（yorozu-craft.com）

## SEO対策チェックリスト

- [x] title / meta description（キーワード最適化済み）
- [x] Open Graph / Twitter Card メタタグ（共有用画像 og-image.png）
- [x] JSON-LD構造化データ（WebApplication + FAQPage）
- [x] canonical URL
- [x] セマンティックHTML（nav, main, section, article, header, footer）
- [x] ARIA属性（aria-label, aria-live, role）
- [x] sitemap.xml（robots.txt はドメイン直下で管理）
- [x] レスポンシブデザイン

## 今後追加予定の機能

- **PWA 対応**: オフライン動作、ホーム画面に追加
- **効果音**: ON/OFF 切り替え可能な効果音
- **候補のインポート/エクスポート**: JSON 形式での候補管理
- **カスタムテーマ**: ユーザー独自のテーマ作成
- **多言語対応**: 英語・中国語など

## ライセンス

MIT License
