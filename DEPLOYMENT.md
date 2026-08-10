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

「リマインド通知」機能（[CLAUDE.md](CLAUDE.md)の「プッシュ通知リマインダー」セクション参照）の有効化に必要な手動セットアップは完了済み（2026-08-01）。未実施でもアプリ自体は問題なく動作する（通知機能のみ非対応として無効化される）ため、以下は将来別プロジェクトへ展開する場合や再セットアップ時の手順として残す。

1. VercelダッシュボードのStorageタブ、または`vercel integration add upstash/upstash-kv`でRedis系のストレージ連携を追加する（「Vercel KV」は非推奨化されており、現在はVercel Marketplace経由の「Upstash for Redis」を利用する）。インストール時にUpstash社の利用規約への同意がブラウザで必要（`vercel integration add`実行後に表示される`verification_uri`を開いて同意する）。連携すると`KV_REST_API_URL`/`KV_REST_API_TOKEN`が自動的に環境変数へ追加される。
2. ローカル端末のターミナルで以下を実行し、VAPID鍵ペアを生成する（**秘密鍵をチャットや公開リポジトリに貼らないこと**）。
   ```bash
   npx web-push generate-vapid-keys
   ```
3. Vercelダッシュボード → Project Settings → Environment Variables（または`vercel env add <名前> <environment> --value=<値>`）に以下を追加する。

   | 変数 | 値の例 | 備考 |
   |---|---|---|
   | `VITE_VAPID_PUBLIC_KEY` | 手順2の公開鍵 | クライアントのビルドに埋め込まれる。**ビルド前に設定すること** |
   | `VAPID_PUBLIC_KEY` | 手順2の公開鍵（同じ値） | サーバー側`web-push`用 |
   | `VAPID_PRIVATE_KEY` | 手順2の秘密鍵 | `VITE_`接頭辞を付けないこと（付けるとクライアントに漏洩する） |
   | `VAPID_SUBJECT` | 例: `mailto:nakasho4949@gmail.com` | Web Push仕様上必須の連絡先 |
   | `CRON_SECRET` | 任意のランダム文字列（例: `openssl rand -hex 32`の出力） | `api/cron/reminder.ts`の認証、Vercel Cronからのリクエストにも自動付与される |

4. ローカル開発でも通知トグルを試したい場合は、`.env.local`（gitignore対象）に`VITE_VAPID_PUBLIC_KEY`を追加する。ただし`api/`配下はVercel Functionsとして動くため、`npm run dev`（Vite単体）では購読・送信までは確認できない（`vercel dev`を使うか、実際にデプロイして確認する）。
5. コードをpushして再デプロイし、`vercel.json`のCron設定が反映されたことをVercelダッシュボードの「Cron Jobs」で確認する。
6. 実機でアプリを開き、「設定」→「リマインド通知」をオンにして通知許可を承認する。
7. 動作確認は次のいずれかで行う: (a) 次のCron発火を待つ、(b) `CRON_SECRET`をBearerトークンとして手動で`/api/cron/reminder`を呼び出す（`curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://gyaku-fukushou-app.vercel.app/api/cron/reminder`）。

### トラブルシューティング: 通知の許可後も「通知の設定に失敗しました」と表示される

ブラウザ側で通知を許可していても、OS（Windows/macOS/Android等）側の通知設定でそのブラウザアプリ自体がブロックされていると、`pushManager.subscribe()`が失敗しこの状態になることがある（実機で確認された事例、2026-08-01）。

- Windows: 設定 → システム → 通知 → 対象ブラウザ（例: Microsoft Edge）がオンになっているか確認
- Windows: `edge://settings/content/notifications`（Chromeなら`chrome://settings/content/notifications`）で対象サイトが「ブロック」リストに入っていないか確認
- macOS: システム設定 → 通知 → 対象ブラウザの通知が許可されているか確認
- Android: 設定 → アプリ → 対象ブラウザ → 通知が許可されているか確認

設定画面のトグルがOFFのまま失敗する場合は、ブラウザの開発者ツール（F12）のコンソールに`[push] subscribeToPush failed ...`のログが出力されるので、原因の特定に利用できる。

### Vercel Cronの実行頻度制限（Hobbyプラン）

Vercel HobbyプランはCronジョブを**1日1回まで**しか実行できない（`0 * * * *`のような毎時実行はデプロイ時に失敗する）。そのため`vercel.json`は`0 12 * * *`（UTC 12:00 = JST 21:00ごろ、実行は最大59分前後する）の1日1回実行にしている。ユーザーごとに送信時刻を選ばせる設計は行っていない（全ユーザー共通の固定時刻）。より高頻度・高精度なCronが必要な場合はVercel Proプランへのアップグレードが必要。

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

## Androidアプリ化（TWA）のセットアップ

本アプリをAndroidアプリとして配布する場合、[TWA（Trusted Web Activity）](https://developer.chrome.com/docs/android/trusted-web-activity)方式を推奨する（実行エンジンが端末の実Chromeそのものになるため、ことばモードが依存する`SpeechRecognition`/`speechSynthesis`がAndroid標準WebViewより安定して動作する。詳細は[CLAUDE.md](CLAUDE.md)の「音声認識・音声合成のAndroid対応方針」を参照）。

### 前提

- 本番PWAが既にデプロイ済みで、manifestが`id`/`orientation`/`display_override`を含む状態であること（`vite.config.ts`のVitePWA設定）。
- アイコン（192/512/maskable 512）は既存のものをそのまま流用できる。

### 手順（[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) CLIを使う場合）

1. Node.js環境に`@bubblewrap/cli`をインストールする（`npm i -g @bubblewrap/cli`、初回はAndroid SDK/JDKの自動セットアップが走る）。
2. プロジェクトルート以外の作業ディレクトリで初期化する（本リポジトリには含めない、Androidプロジェクトは別リポジトリ管理を推奨）。
   ```bash
   bubblewrap init --manifest=https://gyaku-fukushou-app.vercel.app/manifest.webmanifest
   ```
3. 対話形式でパッケージ名（例: `app.vercel.gyaku_fukushou_app.twa`）・署名鍵を設定する。署名鍵（`.keystore`ファイル）は**絶対にリポジトリにコミットしない**。パスワードともに安全な場所（パスワードマネージャー等）で管理する。
4. ビルドする。
   ```bash
   bubblewrap build
   ```
5. 生成された`.apk`/`.aab`をローカル実機・エミュレータで動作確認する（音声認識・音声合成・Web Audio・Web Push・Wake Lock・バイブレーション等、Web APIに依存する機能が実機でも動くか確認する。この開発環境では実機検証ができないため、必ず実施すること）。

### Digital Asset Links（アプリ内ブラウザバー非表示に必須）

TWAはDigital Asset Linksによる検証に成功しないと、URLバー付きのCustom Tabとして開かれてしまい「アプリらしさ」が失われる。

1. 署名鍵からSHA-256フィンガープリントを取得する。
   ```bash
   keytool -list -v -keystore <keystoreファイル> -alias <alias名>
   ```
2. [public/.well-known/assetlinks.json](public/.well-known/assetlinks.json)の`package_name`と`sha256_cert_fingerprints`を実際の値に置き換える（このファイルは雛形として`REPLACE_WITH_...`のプレースホルダーが入っている）。
3. コミット・pushして本番反映し、`https://gyaku-fukushou-app.vercel.app/.well-known/assetlinks.json`が正しいJSONで配信されることを確認する。
4. [Statement List Generator and Tester](https://developers.google.com/digital-asset-links/tools/generator)で検証する。
5. Google Play Consoleで公開する場合、Play App Signingが有効だとアップロード時の署名鍵と配布時の署名鍵が異なることがある（Play Consoleの「App integrity」→「App signing」に表示される配布用SHA-256フィンガープリントを使って`assetlinks.json`を更新する必要がある）。

### Play Console提出時の留意点

- 「データセーフティ」セクションの申告内容は[PRIVACY.md](PRIVACY.md)の「Google Play向けデータセーフティ申告の対応表」と整合させること。
- プライバシーポリシーURLには`https://gyaku-fukushou-app.vercel.app/privacy.html`（日本語）を指定する。

## 関連ファイル

- [.github/workflows/ci.yml](.github/workflows/ci.yml) — lint/test/buildの自動実行
- [CLAUDE.md](CLAUDE.md) — アプリ全体の仕様
- [public/.well-known/assetlinks.json](public/.well-known/assetlinks.json) — TWA用Digital Asset Linksの雛形
- [PRIVACY.md](PRIVACY.md) — プライバシーポリシー・Google Playデータセーフティ対応表
