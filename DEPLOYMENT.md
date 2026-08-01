# デプロイ手順書

本アプリはVercel上にデプロイされている（本番URL: https://gyaku-fukushou-app.vercel.app/ ）。

## 前提

- バックエンドを持たない静的SPAのため、環境変数の設定は不要（現時点で`.env`類は使用していない）。
- ビルド成果物は`dist/`ディレクトリ（Vite標準）。

## Vercelプロジェクト設定

| 項目 | 値 |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build`（`tsc -b && vite build`） |
| Output Directory | `dist` |
| Install Command | `npm ci`（デフォルト） |
| Node.js Version | 24.x を推奨（[CI](.github/workflows/ci.yml)と揃える） |

## デプロイ方法

### 方法A: GitHub連携（推奨・自動デプロイ）

1. Vercelダッシュボードで「Add New Project」→ GitHubリポジトリ [Compass-1024/gyaku-fukushou-app](https://github.com/Compass-1024/gyaku-fukushou-app) を選択してインポートする。
2. Framework PresetがViteとして自動検出されることを確認し、上表の設定のままデプロイする。
3. 以降、`master`ブランチへのpushで自動的に本番デプロイが走る。プルリクエストごとにプレビューデプロイも自動生成される。

### 方法B: Vercel CLIから手動デプロイ

```bash
npm install -g vercel
vercel login
vercel link   # 初回のみ。既存のVercelプロジェクトと紐付ける
vercel --prod
```

`vercel link`で生成される`.vercel/`ディレクトリはプロジェクトID等を含むため`.gitignore`済み。コミットしないこと。

## デプロイ前のローカル確認

```bash
npm run lint
npm run test
npm run build
npm run preview
```

[CI](.github/workflows/ci.yml)でも同じ内容（lint/test/build）をpush・PR時に自動実行しているため、CIが通っていればデプロイ後の重大な破損リスクは低い。

## PWA・キャッシュに関する注意点

- `vite-plugin-pwa`は`registerType: 'autoUpdate'`を使用しているため、デプロイ後は新しいService Workerが自動的にバックグラウンドで取得・適用される。ただし、開いたままのタブでは反映に多少のタイムラグがある（次回訪問時 or タブ再読み込みで確実に反映される）。
- 大きな挙動変更をデプロイした際は、PWAとしてホーム画面に追加している利用者に対して即座に反映されない可能性があることを念頭に置く。

## ロールバック

Vercelダッシュボードの「Deployments」タブから過去のデプロイを選択し、「Promote to Production」を実行することで即座に切り戻せる。`git revert`でコードを戻して再pushする方法でも良い。

## 関連ファイル

- [.github/workflows/ci.yml](.github/workflows/ci.yml) — lint/test/buildの自動実行
- [CLAUDE.md](CLAUDE.md) — アプリ全体の仕様
