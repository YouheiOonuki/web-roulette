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
- **テストモード**: 乱数固定、アニメーション高速化、デバッグログ表示

### SEO・AdSense対応
- **SEO最適化**: meta description、Open Graph、Twitter Card、JSON-LD構造化データ（WebApplication + FAQPage）
- **AdSense審査対応**: プライバシーポリシー、ナビゲーション、使い方ガイド、FAQ、robots.txt、sitemap.xml
- **広告枠**: コンテンツ間（728x90）とフッター上（300x250）の2箇所にプレースホルダー

## ファイル構成

```
web-roulette/
├── index.html            # メインHTML（SEOメタタグ・構造化データ含む）
├── style.css             # テーマ対応スタイルシート
├── main.js               # アプリケーションロジック
├── privacy-policy.html   # プライバシーポリシー（AdSense必須）
├── robots.txt            # クローラー向け指示
├── sitemap.xml           # サイトマップ
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

## GitHub Pages での公開手順

### 方法1: main ブランチ直接公開

1. GitHub のリポジトリページで **Settings** → **Pages** を開く
2. **Source** を `Deploy from a branch` に設定
3. **Branch** を `main`、フォルダを `/ (root)` に設定
4. **Save** をクリック
5. 数分後に `https://youheioonuki.github.io/web-roulette/` で公開

### 方法2: docs フォルダで公開

1. `docs/` フォルダを作成し、全HTMLファイル + CSS + JS + robots.txt + sitemap.xml をコピー
2. **Settings** → **Pages** でフォルダを `/docs` に設定

> すべてのファイル参照は相対パスのため、どちらの方法でも動作します。

## 広告枠について

`index.html` に2箇所の広告プレースホルダーがあります。

### 上部（コンテンツ間・リーダーボード 728x90）
```html
<!-- AD_PLACEHOLDER_TOP: Google AdSense code will be inserted here -->
```

### 下部（フッター上・レクタングル 300x250）
```html
<!-- AD_PLACEHOLDER_BOTTOM: Google AdSense code will be inserted here -->
```

対応する `.ad-placeholder` の `<div>` を AdSense のコードに差し替えてください。

## AdSense 審査対策チェックリスト

- [x] プライバシーポリシーページ (`privacy-policy.html`)
- [x] ナビゲーション（ヘッダー + フッター）
- [x] 十分なテキストコンテンツ（使い方ガイド + FAQ）
- [x] 複数ページ構成
- [x] robots.txt / sitemap.xml
- [x] 適切な広告枠サイズ（728x90 + 300x250）

## SEO対策チェックリスト

- [x] title / meta description（キーワード最適化済み）
- [x] Open Graph / Twitter Card メタタグ
- [x] JSON-LD構造化データ（WebApplication + FAQPage）
- [x] canonical URL
- [x] セマンティックHTML（nav, main, section, article, header, footer）
- [x] ARIA属性（aria-label, aria-live, role）
- [x] robots.txt + sitemap.xml
- [x] レスポンシブデザイン

## 今後追加予定の機能

- **PWA 対応**: オフライン動作、ホーム画面に追加
- **効果音**: ON/OFF 切り替え可能な効果音
- **候補のインポート/エクスポート**: JSON 形式での候補管理
- **カスタムテーマ**: ユーザー独自のテーマ作成
- **多言語対応**: 英語・中国語など

## ライセンス

MIT License
