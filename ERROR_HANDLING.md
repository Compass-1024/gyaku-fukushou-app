# エラー監視・ロギング方針

このアプリはバックエンドを持たないSPAのため、サーバーサイドのエラー監視は存在しない。クライアント側で発生したエラーをどう捕捉・記録するかの方針をまとめる。

## 方針

- **外部送信は行わない**: Sentry等の外部エラー監視サービスへは現時点で送信しない（プライバシーポリシー上、通信を発生させない設計を優先しているため）。将来的に導入する場合は[PRIVACY.md](PRIVACY.md)の更新とセットで検討する。
- **画面を壊さない**: Reactのレンダリング中に予期しないエラーが発生しても白画面にならないよう、`ErrorBoundary`でキャッチしてフォールバックUI（再読み込み案内）を表示する。
- **すべてのエラーを構造化ログとして記録する**: `console.error`に出力し、開発者ツールで追跡できるようにする。

## 実装

| 対象 | 実装箇所 |
|---|---|
| Reactレンダリング中の例外 | `src/components/ErrorBoundary.tsx`（`componentDidCatch`で`logError`を呼ぶ） |
| 非同期処理中の未捕捉例外（`window.onerror`） | `src/lib/logger.ts`の`installGlobalErrorHandlers`（`main.tsx`で起動時に登録） |
| 未処理のPromise rejection（`unhandledrejection`） | 同上 |
| ロギング本体 | `src/lib/logger.ts`の`logError` / `getRecentErrors` |

`logError(context, error)`は、

1. `console.error`に`[context]`プレフィックス付きでエラーを出力する
2. 直近20件をメモリ上（ページ再読み込みで消える）に保持し、`getRecentErrors()`で取得できるようにする（開発者ツールのコンソールからの事後確認用）

個人情報やlocalStorageの中身（学習履歴等）はログに含めない。エラーオブジェクトの`message`/`stack`のみを記録する。

## 今後の検討事項

- 外部監視サービス（Sentryなど）を導入する場合は、送信内容の最小化（PIIを含めない）とプライバシーポリシーへの明記を先に行う。
- `ErrorBoundary`は現状アプリ全体を1つのバウンダリで覆っているのみ。ゲーム画面など特定領域だけを個別に保護し、他の画面への影響を防ぐ分割も将来的な選択肢。

## 関連ファイル

- [PRIVACY.md](PRIVACY.md) — プライバシーポリシー
- [CLAUDE.md](CLAUDE.md) — アプリ全体の仕様
