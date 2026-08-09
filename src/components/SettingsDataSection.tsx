import { useRef, useState, type ChangeEvent } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'
import { clearHistory, loadHistory, replaceHistory } from '../lib/history'
import { loadMissionCompletions, replaceMissionCompletions } from '../lib/missions'
import {
  loadDailyChallengeCompletions,
  replaceDailyChallengeCompletions,
} from '../lib/dailyChallenge'
import {
  backupFileName,
  createBackup,
  parseBackupJson,
  serializeBackup,
} from '../lib/backup'
import { useTranslation } from '../contexts/LanguageContext'
import type { AppSettings } from '../types'

interface SettingsDataSectionProps {
  onImported: (settings: AppSettings) => void
}

export function SettingsDataSection({ onImported }: SettingsDataSectionProps) {
  const t = useTranslation()
  const [historyCleared, setHistoryCleared] = useState(false)
  const [importMessage, setImportMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleClearHistory() {
    if (!window.confirm(t.settings.data.clearHistoryConfirm)) {
      return
    }
    clearHistory()
    setHistoryCleared(true)
  }

  function handleExport() {
    const backup = createBackup(
      loadHistory(),
      loadSettings(),
      loadMissionCompletions(),
      loadDailyChallengeCompletions(),
    )
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
      setImportMessage({
        type: 'error',
        text: t.settings.data.importErrors[result.error],
      })
      return
    }

    if (
      !window.confirm(t.settings.data.importConfirm(result.data.history.length))
    ) {
      return
    }

    replaceHistory(result.data.history)
    replaceMissionCompletions(result.data.missionCompletions)
    replaceDailyChallengeCompletions(result.data.dailyChallengeCompletions)
    saveSettings(result.data.settings)
    onImported(result.data.settings)
    setHistoryCleared(false)
    setImportMessage({
      type: 'success',
      text: t.settings.data.importSuccess,
    })
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.settings.data.title}
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t.settings.data.description}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="touch-manipulation rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {t.settings.data.exportButton}
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="touch-manipulation rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {t.settings.data.importButton}
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
        {t.settings.data.clearHistoryButton}
      </button>
      {historyCleared && (
        <p role="status" className="text-xs text-gray-500 dark:text-gray-400">
          {t.settings.data.clearedMessage}
        </p>
      )}
    </section>
  )
}
