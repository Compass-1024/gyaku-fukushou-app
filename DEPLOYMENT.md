# デプロイ手順書

本アプリはVercel上にデプロイされている（本番URL: https://gyaku-fukushou-app.vercel.app/ ）。

## 前提

- トレーニング機能自体はバックエンドを持たない静的SPA。
- ただし、オプトインの「リマインド通知」機能のみVercel Serverless Functions + Redisストレージを使うため、この機能を有効化するには下記「プッシュ通知リマインダーのセットアップ」に記載の環境変数が必要（未設定でもビルド・デプロイ自体は可能で、その場合は通知機能が非対応として無効化されるだけで他機能に影響しない）。
- ビルド成果物は`dist/`ディレクトリ（Vite標準）。

## Vercelプロジェクト設定

| 項目 | 値 |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build`（`tsc -b && vite build`） |
| Output Directory | `dist` |
| Install Command | `npm ci`（デフォルト） |
| Node.js Version | 24.x を推奨（[CI](.github/workflows/ci.yml)と揃える） |

## 現在の運用状況

2026-08-01付けでVercelプロジェクトとGitHubリポジトリ [Compass-1024/gyaku-fukushou-app](https://github.com/Compass-1024/gyaku-fukushou-app) のGit連携（`vercel git connect`）が完了した。以降は**方法A（`master`へのpushで自動デプロイ）が既定の運用**となる。設定に至るまでの経緯は以下の通り。

1. `vercel git connect`実行時、最初は「Vercelアカウントに対するGitHubログイン連携が必要」エラーが発生 → [Account Settings → Login Connections](https://vercel.com/account/login-connections) でGitHubログイン連携を追加して解消。
2. 次に「リポジトリへのアクセス権がない」エラーが発生 → [https://github.com/apps/vercel](https://github.com/apps/vercel) からVercelのGitHub Appをインストールし、対象リポジトリへのアクセスを許可して解消（ログイン連携とGitHub Appのインストールは別物であることに注意）。
3. `npx vercel git connect`を再実行して接続完了。

### 方法A: GitHub連携（現在の既定の運用・自動デプロイ）

`master`ブランチへのpushで自動的に本番デプロイが走る。プルリクエストごとにプレビューデプロイも自動生成される。追加の操作は不要。

### 方法B: Vercel CLIから手動デプロイ（緊急時・検証用）

```bash
npx vercel login   # 初回のみ
npx vercel link    # 初回のみ。既存のVercelプロジェクトと紐付ける
npx vercel --prod
```

`vercel link`で生成される`.vercel/`ディレクトリはプロジェクトID等を含むため`.gitignore`済み。コミットしないこと。

## プッシュ通知リマインダーのセットアップ（初回のみ・手動）

「リマインド通知」機能（[CLAUDE.md](CLAUDE.md)の「プッシュ通知リマインダー」セクション参照）を有効化するには、以下の手動セットアップが必要。未実施でもアプリ自体は問題なく動作する（通知機能のみ非対応として無効化される）。

1. VercelダッシュボードのStorageタブで、このプロジェクトにRedis系のストレージ連携を追加する（「Vercel KV」は非推奨化されており、現在はVercel Marketplace経由のRedisインテグレーション（Upstash等）を利用する。ダッシュボードで現在の正式名称・手順を確認すること）。連携すると`KV_REST_API_URL`/`KV_REST_API_TOKEN`または`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`が自動的に環境変数へ追加される（`api/_lib/kv.ts`はどちらの命名規則にも対応済み）。
2. ローカル端末のターミナルで以下を実行し、VAPID鍵ペアを生成する（**秘密鍵をチャットや公開リポジトリに貼らないこと**）。
   ```bash
   npx web-push generate-vapid-keys
   ```
3. Vercelダッシュボード → Project Settings → Environment Variablesに以下を追加する。

   | 変数 | 値の例 | 備考 |
   |---|---|---|
   | `VITE_VAPID_PUBLIC_KEY` | 手順2の公開鍵 | クライアントのビルドに埋め込まれる。**ビルド前に設定すること** |
   | `VAPID_PUBLIC_KEY` | 手順2の公開鍵（同じ値） | サーバー側`web-push`用 |
   | `VAPID_PRIVATE_KEY` | 手順2の秘密鍵 | `VITE_`接頭辞を付けないこと（付けるとクライアントに漏洩する） |
   | `VAPID_SUBJECT` | 例: `mailto:nakasho4949@gmail.com` | Web Push仕様上必須の連絡先 |
   | `CRON_SECRET` | 任意のランダム文字列（例: `openssl rand -hex 32`の出力） | `api/cron/reminder.ts`の認証、Vercel Cronからのリクエストにも自動付与される |

4. ローカル開発でも通知トグルを試したい場合は、`.env.local`（gitignore対象）に`VITE_VAPID_PUBLIC_KEY`を追加する。ただし`api/`配下はVercel Functionsとして動くため、`npm run dev`（Vite単体）では購読・送信までは確認できない（`vercel dev`を使うか、実際にデプロイして確認する）。
5. コードをpushして再デプロイし、`vercel.json`のCron設定（`/api/cron/reminder`を毎時0分に実行）が反映されたことをVercelダッシュボードの「Cron Jobs」で確認する。
6. 実機でアプリを開き、「設定」→「リマインド通知」をオンにして通知許可を承認する。
7. 動作確認は次のいずれかで行う: (a) 次のCron発火（毎時0分）を待つ、(b) `CRON_SECRET`をBearerトークンとして手動で`/api/cron/reminder`を呼び出す（`curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://gyaku-fukushou-app.vercel.app/api/cron/reminder`）。

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
