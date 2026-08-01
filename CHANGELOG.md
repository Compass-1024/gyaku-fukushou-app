# Changelog

このプロジェクトの変更履歴。[Keep a Changelog](https://keepachangelog.com/ja/1.0.0/)の形式に準拠する。

## [Unreleased]

### Added

- 結果画面（SetSummary、全モード共通）に「結果をシェア」機能を追加。正答数・連続挑戦日数・新規実績をまとめたテキストを`navigator.share`で共有し、非対応環境ではクリップボードコピーにフォールバックする（`src/lib/share.ts`）
- 学習データのバックアップ（エクスポート/インポート）機能を追加。設定画面からトレーニング履歴・アプリ設定をJSONファイルとして書き出し・復元できる。localStorageのみに依存する構成でのデータ消失リスクに対応（`src/lib/backup.ts`、不正なデータ形式は検証して拒否）
- 統計画面に学習カレンダー（GitHub風ヒートマップ）を追加。日曜始まりの週単位グリッドで直近18週間の日別セット数を可視化し、継続の実感を後押しする（`getActivityCalendar`）
- CI（GitHub Actions）を導入し、push/PR時にlint・test・buildを自動実行
- ROADMAP.md、CHANGELOG.mdを追加
- E2Eテスト（Playwright）を導入し、主要画面遷移・すうじ/Nバックモードのプレイ導線をカバー。CIにも統合
- エラー監視・ロギング方針を実装（`ErrorBoundary`、グローバルエラーハンドラ、[ERROR_HANDLING.md](ERROR_HANDLING.md)）
- アクセシビリティ方針を明文化し、aria-label・aria-live・フォーカス管理を見直し（[ACCESSIBILITY.md](ACCESSIBILITY.md)）
- プライバシーポリシーを作成（[PRIVACY.md](PRIVACY.md)＋設定画面から遷移できるアプリ内画面＋JS起動不要な静的ページ`public/privacy.html`）
- デプロイ手順書を作成（[DEPLOYMENT.md](DEPLOYMENT.md)）
- VercelとGitHubリポジトリのGit連携を設定し、masterへのpushで自動デプロイされるように変更
- トップ画面に「🎯 今日のおすすめ」カードを追加。苦手分野（`getWeakestAreas`）をワンタップで直接プレイ開始できるように
- 結果画面に自己ベスト更新バッジ（🏅）を追加。モード・レベルごとの過去最高正答率を`getBestSetAccuracy`で判定
- トップ画面にストリーク危機感バナーを追加（連続日数があるのに当日未挑戦の場合に表示）
- ことばモードに`SpeechRecognition`非対応ブラウザ向けのテキスト入力フォールバックを追加。従来はレベル選択自体をブロックしていたが、テキスト入力で全レベルに挑戦できるように変更
- ことば/すうじモードの結果表示中、Enterキーで次の問題へ進めるように対応（すうじモードの回答入力は既に対応済み）
- Nバックモードの「一致」操作にEnterキーも追加（スペースキーと併用可）
- 3問セット完了後の結果まとめ画面（SetSummary、全モード共通）で、Enterキーによる主要アクション（提案があればそれ、なければ「同じレベルでもう一度」）の実行に対応
- 設定画面に「学習履歴をすべて削除」ボタンを追加（確認ダイアログ付き）。これまでPRIVACY.mdで「専用機能は未提供」としていたギャップを解消
- 苦手分野の判定（`getWeakestAreas`）を改善。1回のたまたまの失敗で「今日のおすすめ」に出てしまわないよう、挑戦回数が十分な項目を優先するようにした
- E2Eテストを追加（結果表示中のEnterキー操作、ことばモードのテキスト入力フォールバック）
- SEO/SNSシェア対応として`index.html`にmeta description・OGP・Twitter Cardタグを追加

### Performance

- `GameScreen`/`DigitGameScreen`/`NBackGameScreen`を`React.lazy`による遅延読み込みに変更。初期表示に必要なJSバンドルを約253KB→約234KB（gzip: 約76.7KB→約72.9KB）に削減し、モバイル回線での初回表示を高速化

### Fixed

- `index.html`のviewport metaに`viewport-fit=cover`を追加。これが無いとiOS Safariで`env(safe-area-inset-*)`が常に0として扱われ、App.tsxで指定していたノッチ・ホームインジケーター避けのpaddingが実質的に無効化されていた

### Changed

- 要件定義書.mdの内容をCLAUDE.mdに統合（画面遷移図はMermaid形式に変換）
- GitHubリポジトリをPublicに変更後、連絡先メールアドレスを記載する都合上Privateに戻した
- プライバシーポリシーの連絡先をGitHub Issueからメールアドレスに変更
- GitHubリポジトリをPublicに変更（連絡先メールアドレスは公開前に別途記載予定のため、プライバシーポリシー本文からは一時的に削除）
- GitHub ActionsのNode.js 20非推奨警告を解消（`actions/checkout`・`actions/setup-node`をv5系へ更新）

## [0.1.0] - 2026-08-01

### Added

- 初回コミット。ことば／すうじ／Nバックの3モードを実装
- 実績（アチーブメント）システム（11種類、動的判定）
- Web Audio APIによるプログラム生成の効果音システム
- 統計・履歴画面、設定画面（テーマ／音声／効果音／目標セット数）
- PWA対応（`vite-plugin-pwa`）
- GitHubリポジトリ連携（[Compass-1024/gyaku-fukushou-app](https://github.com/Compass-1024/gyaku-fukushou-app)）
