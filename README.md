# 🎰 ルーレット / くじ引き Web アプリ

完全ローカルで動作する「ルーレット / くじ引き」Web アプリです。
API を一切使用せず、HTML / CSS / JavaScript の静的サイトとして構築されています。

## ✨ 機能一覧

### 候補管理
- **手動入力**: テキストボックスから候補を追加（改行・カンマ・セミコロンで区切り可能）
- **ファイルアップロード**: `.txt` ファイルから候補を一括読み込み
- **候補一覧表示**: 削除ボタン付きリスト
- **プリセット**: 初回アクセス時にデフォルト候補（カレー、ラーメン、寿司、焼肉、パスタ）が自動セット
- **ローカルストレージ保存**: ブラウザを閉じても候補が保持される

### ルーレット
- **演出 ON**: 候補が順番にハイライトされ、徐々に減速して確定する「ドキドキ演出」
- **演出 OFF**: 即時ランダム選択
- **効果音なし**: 完全無音

### その他の機能
- **シャッフルモード**: 候補をランダムに並び替え
- **重み付け（ON/OFF）**: 各候補に 1〜3 の重みを設定可能
- **テーマ切り替え**: ダーク / メタル / ネオンサイバー / 和紙風
- **履歴（ON/OFF）**: 過去10回の結果をローカル保存
- **テストモード**: 乱数固定、アニメーション高速化、デバッグログ表示
- **広告枠**: AdSense 用プレースホルダー付き

## 📁 ファイル構成

```
web-roulette/
├── index.html    # メインHTML
├── style.css     # テーマ対応スタイルシート
├── main.js       # アプリケーションロジック
└── README.md     # このファイル
```

## 🚀 ローカルでの動作確認

1. リポジトリをクローンまたはダウンロード
2. `index.html` をブラウザで直接開く

```bash
# クローン
git clone <repository-url>
cd web-roulette

# ブラウザで開く（macOS）
open index.html

# ブラウザで開く（Windows）
start index.html

# ブラウザで開く（Linux）
xdg-open index.html
```

ローカルサーバーを使う場合：

```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve .
```

## 🌐 GitHub Pages での公開手順

### 方法1: main ブランチ直接公開

1. GitHub のリポジトリページで **Settings** → **Pages** を開く
2. **Source** を `Deploy from a branch` に設定
3. **Branch** を `main`、フォルダを `/ (root)` に設定
4. **Save** をクリック
5. 数分後に `https://<username>.github.io/<repo-name>/` で公開される

### 方法2: docs フォルダで公開

1. リポジトリのルートに `docs/` フォルダを作成
2. `index.html`、`style.css`、`main.js` を `docs/` にコピー
3. GitHub の **Settings** → **Pages** で、フォルダを `/docs` に設定
4. **Save** をクリック

> すべてのファイル参照は相対パスのため、どちらの方法でも正しく動作します。

## 📢 広告枠について

`index.html` のフッター部分に広告プレースホルダーが含まれています。

```html
<!-- AD_PLACEHOLDER: Google AdSense code will be inserted here -->
```

Google AdSense のコードをこのコメントの位置に貼り付けるだけで、広告が表示されます。
`.ad-placeholder` の `<div>` を AdSense のコードに差し替えてください。

## 🔮 今後追加予定の機能

- **PWA 対応**: オフライン動作、ホーム画面に追加
- **効果音**: ON/OFF 切り替え可能な効果音
- **候補のインポート/エクスポート**: JSON 形式での候補管理
- **カスタムテーマ**: ユーザー独自のテーマ作成
- **多言語対応**: 英語・中国語など

## 📝 ライセンス

MIT License
