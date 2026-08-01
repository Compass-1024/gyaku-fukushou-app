# ROADMAP

逆復唱トレーニングアプリの今後の開発候補・バックログ。優先度や着手判断は都度相談の上で決める。完了した項目は[CHANGELOG.md](CHANGELOG.md)に移す。

## 進行中

- なし

## 候補（未着手）

開発基盤の整備状況を踏まえた候補。実装を依頼された際にここから拾う、あるいは新規追加する。

- [ ] カラーコントラストの機械的検証、スクリーンリーダーでの実機確認（[ACCESSIBILITY.md](ACCESSIBILITY.md)の既知の課題を参照）
- [ ] E2Eテストのカバレッジ拡大（実際の音声認識・音声合成を伴うフローは未カバー。Enterキー操作・テキスト入力フォールバックは2026-08-01に追加済み）
- [ ] 出題そのものの優先度を苦手分野に応じて調整（現状は「おすすめ」導線のみで、通常の出題プールはランダム抽選のまま）

## 完了

- [x] 要件定義書のCLAUDE.mdへの統合（2026-08-01）
- [x] GitHubリポジトリ連携（[Compass-1024/gyaku-fukushou-app](https://github.com/Compass-1024/gyaku-fukushou-app)、2026-08-01）
- [x] CI（GitHub Actions）導入（2026-08-01）
- [x] E2Eテストの導入（Playwright、`e2e/`配下に主要導線のスモークテスト、CI統合、2026-08-01）
- [x] エラー監視・ロギング方針の実装（`ErrorBoundary`＋グローバルエラーハンドラ、[ERROR_HANDLING.md](ERROR_HANDLING.md)、2026-08-01）
- [x] アクセシビリティ方針の明文化と対応（[ACCESSIBILITY.md](ACCESSIBILITY.md)、aria-label/aria-live/フォーカス管理の見直し、2026-08-01）
- [x] プライバシーポリシーの作成（[PRIVACY.md](PRIVACY.md)＋アプリ内画面＋静的ページ`public/privacy.html`、連絡先メール記載、2026-08-01）
- [x] デプロイ手順書の作成（[DEPLOYMENT.md](DEPLOYMENT.md)、2026-08-01）
- [x] Vercel⇔GitHub のGit連携設定（push時の自動デプロイ化、2026-08-01）
- [x] GitHub Actions の Node.js 20 非推奨警告の解消（`actions/checkout`/`actions/setup-node`をv5系へ更新、2026-08-01）
- [x] `SpeechRecognition`非対応ブラウザ向けの代替回答手段（ことばモードのテキスト入力フォールバック、2026-08-01）
- [x] 結果表示中のEnterキー操作対応（ことば/すうじモード、2026-08-01）
- [x] 学習履歴の一括削除機能（設定画面、2026-08-01）
- [x] 苦手分野判定の精度改善（挑戦回数が十分な項目を優先、2026-08-01）
