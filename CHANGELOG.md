# Changelog

このプロジェクトの変更履歴。[Keep a Changelog](https://keepachangelog.com/ja/1.0.0/)の形式に準拠する。

## [Unreleased]

### Added

- CI（GitHub Actions）を導入し、push/PR時にlint・test・buildを自動実行
- ROADMAP.md、CHANGELOG.mdを追加

### Changed

- 要件定義書.mdの内容をCLAUDE.mdに統合（画面遷移図はMermaid形式に変換）

## [0.1.0] - 2026-08-01

### Added

- 初回コミット。ことば／すうじ／Nバックの3モードを実装
- 実績（アチーブメント）システム（11種類、動的判定）
- Web Audio APIによるプログラム生成の効果音システム
- 統計・履歴画面、設定画面（テーマ／音声／効果音／目標セット数）
- PWA対応（`vite-plugin-pwa`）
- GitHubリポジトリ連携（[Compass-1024/gyaku-fukushou-app](https://github.com/Compass-1024/gyaku-fukushou-app)）
