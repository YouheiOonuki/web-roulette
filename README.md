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
- **広告枠**: ルーレットの操作を邪魔しないよう、各ページの最下部に1か所

## ファイル構成

```
web-roulette/
├── index.html            # メインHTML（SEOメタタグ・構造化データ含む）
├── style.css             # テーマ対応スタイルシート
├── main.js               # アプリケーションロジック
├── guide.html            # 使い方ガイド・よくある質問
├── about.html            # 運営者情報・免責事項
├── privacy-policy.html   # プライバシーポリシー（AdSense必須）
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

## 広告枠について

`index.html` と `guide.html` の最下部（フッターの下）に広告プレースホルダーが1か所ずつあります。

```html
<!-- AD_PLACEHOLDER: Google AdSense code will be inserted here -->
```

このコメントの直後にある `.ad-placeholder` の `<div>` を AdSense のコードに差し替えてください。

## AdSense 審査対策チェックリスト

- [x] プライバシーポリシー（`privacy-policy.html`）
- [x] 運営者情報・免責事項（`about.html`）
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
