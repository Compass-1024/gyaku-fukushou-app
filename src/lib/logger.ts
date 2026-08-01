export interface LoggedError {
  context: string
  message: string
  stack?: string
  timestamp: string
}

const MAX_ENTRIES = 20

let recentErrors: LoggedError[] = []

/**
 * バックエンドを持たないアプリのため、外部監視サービスへは送信しない。
 * console.error に構造化ログを出力しつつ、直近のエラーをメモリ上に
 * 保持することで、開発者ツールから `getRecentErrors()` を呼んで
 * 事後確認できるようにする（ページ再読み込みで消える）。
 */
export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  const entry: LoggedError = {
    context,
    message,
    stack,
    timestamp: new Date().toISOString(),
  }
  recentErrors = [...recentErrors, entry].slice(-MAX_ENTRIES)
  console.error(`[${context}]`, error)
}

export function getRecentErrors(): LoggedError[] {
  return recentErrors
}

export function installGlobalErrorHandlers(): void {
  window.addEventListener('error', (event) => {
    logError('window.onerror', event.error ?? event.message)
  })
  window.addEventListener('unhandledrejection', (event) => {
    logError('unhandledrejection', event.reason)
  })
}
