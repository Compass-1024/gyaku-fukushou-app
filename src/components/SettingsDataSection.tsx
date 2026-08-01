import { useRef, useState, type ChangeEvent } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'
import { clearHistory, loadHistory, replaceHistory } from '../lib/history'
import {
  backupFileName,
  createBackup,
  parseBackupJson,
  serializeBackup,
} from '../lib/backup'
import type { AppSettings } from '../types'

interface SettingsDataSectionProps {
  onImported: (settings: AppSettings) => void
}

export function SettingsDataSection({ onImported }: SettingsDataSectionProps) {
  const [historyCleared, setHistoryCleared] = useState(false)
  const [importMessage, setImportMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleClearHistory() {
    if (
      !window.confirm(
        '学習履歴・統計・実績をすべて削除します。この操作は取り消せません。よろしいですか？',
      )
    ) {
      return
    }
    clearHistory()
    setHistoryCleared(true)
  }

  function handleExport() {
    const backup = createBackup(loadHistory(), loadSettings())
    const blob = new Blob([serializeBackup(backup)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupFileName()
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    setImportMessage(null)
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const text = await file.text()
    const result = parseBackupJson(text)
    if (!result.ok) {
      setImportMessage({ type: 'error', text: result.error })
      return
    }

    if (
      !window.confirm(
        `現在の学習履歴・設定を、バックアップファイルの内容（履歴${result.data.history.length}件）で上書きします。この操作は取り消せません。よろしいですか？`,
      )
    ) {
      return
    }

    replaceHistory(result.data.history)
    saveSettings(result.data.settings)
    onImported(result.data.settings)
    setHistoryCleared(false)
    setImportMessage({
      type: 'success',
      text: 'インポートしました。トップ画面に戻ると反映されます。',
    })
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        データ
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        学習履歴・実績・設定はこの端末のブラウザ内にのみ保存されています。機種変更やブラウザデータの削除に備えて、定期的にバックアップすることをおすすめします。
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="touch-manipulation rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          ⬇️ バックアップを書き出す
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="touch-manipulation rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          ⬆️ バックアップから復元
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>
      {importMessage && (
        <p
          role="status"
          className={`text-xs ${
            importMessage.type === 'error'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {importMessage.text}
        </p>
      )}
      <button
        type="button"
        onClick={handleClearHistory}
        className="touch-manipulation self-start rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/30"
      >
        学習履歴をすべて削除
      </button>
      {historyCleared && (
        <p role="status" className="text-xs text-gray-500 dark:text-gray-400">
          削除しました。トップ画面に戻ると反映されます。
        </p>
      )}
    </section>
  )
}
