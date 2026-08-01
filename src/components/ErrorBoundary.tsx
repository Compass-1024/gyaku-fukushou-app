import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { logError } from '../lib/logger'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError('ErrorBoundary', error)
    if (info.componentStack) console.error(info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <span aria-hidden="true" className="text-5xl">
            ⚠️
          </span>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            予期しないエラーが発生しました
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            お手数ですが、下のボタンから再読み込みしてください。記録済みのデータはブラウザに保存されているため失われません。
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="touch-manipulation rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400"
          >
            再読み込み
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
