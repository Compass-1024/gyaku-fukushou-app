import { DEFAULT_SETTINGS } from './settings'
import type { AppSettings, DigitGameType, HistoryEntry, Level, Mode } from '../types'

const BACKUP_VERSION = 1

export interface BackupData {
  version: number
  exportedAt: string
  history: HistoryEntry[]
  settings: AppSettings
}

const VALID_MODES: readonly Mode[] = [
  'word',
  'digit',
  'nback',
  'spatial',
  'pattern',
  'tone',
]
const VALID_GAME_TYPES: readonly DigitGameType[] = ['reverse', 'sum']
const VALID_LEVELS: readonly Level[] = [1, 2, 3]

function isValidHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const e = value as Record<string, unknown>
  if (!VALID_MODES.includes(e.mode as Mode)) return false
  if (
    e.gameType !== undefined &&
    !VALID_GAME_TYPES.includes(e.gameType as DigitGameType)
  ) {
    return false
  }
  if (!VALID_LEVELS.includes(e.level as Level)) return false
  if (typeof e.correct !== 'number' || typeof e.total !== 'number') return false
  if (typeof e.timestamp !== 'string' || Number.isNaN(Date.parse(e.timestamp))) {
    return false
  }
  return true
}

export function createBackup(
  history: HistoryEntry[],
  settings: AppSettings,
): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    history,
    settings,
  }
}

export function serializeBackup(backup: BackupData): string {
  return JSON.stringify(backup, null, 2)
}

export function backupFileName(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `gyaku-fukushou-backup-${y}${m}${d}.json`
}

export type ParseBackupResult =
  | { ok: true; data: BackupData }
  | { ok: false; error: string }

// バックアップファイルの内容を検証しつつ読み込む。壊れたJSONや型の合わない
// データでlocalStorageを汚さないよう、フィールドごとに厳格にチェックする
export function parseBackupJson(raw: string): ParseBackupResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      ok: false,
      error: 'ファイルの形式が正しくありません（JSONとして読み込めませんでした）',
    }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'ファイルの内容が正しくありません' }
  }
  const obj = parsed as Record<string, unknown>

  if (!Array.isArray(obj.history) || !obj.history.every(isValidHistoryEntry)) {
    return {
      ok: false,
      error: '学習履歴のデータ形式が正しくありません。別のファイルをお試しください',
    }
  }
  if (typeof obj.settings !== 'object' || obj.settings === null) {
    return {
      ok: false,
      error: '設定のデータ形式が正しくありません。別のファイルをお試しください',
    }
  }

  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...(obj.settings as Partial<AppSettings>),
  }

  return {
    ok: true,
    data: {
      version: typeof obj.version === 'number' ? obj.version : BACKUP_VERSION,
      exportedAt:
        typeof obj.exportedAt === 'string'
          ? obj.exportedAt
          : new Date().toISOString(),
      history: obj.history,
      settings,
    },
  }
}
