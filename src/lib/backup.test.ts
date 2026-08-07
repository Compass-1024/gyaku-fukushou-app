import { describe, expect, it } from 'vitest'
import {
  createBackup,
  serializeBackup,
  parseBackupJson,
  backupFileName,
} from './backup'
import { DEFAULT_SETTINGS } from './settings'
import type { HistoryEntry } from '../types'

const SAMPLE_HISTORY: HistoryEntry[] = [
  { mode: 'word', level: 1, correct: 2, total: 3, timestamp: '2026-08-01T00:00:00.000Z' },
  {
    mode: 'digit',
    gameType: 'reverse',
    level: 2,
    correct: 5,
    total: 5,
    timestamp: '2026-08-01T01:00:00.000Z',
  },
]

describe('createBackup / serializeBackup / parseBackupJson roundtrip', () => {
  it('parses back exactly what was exported', () => {
    const backup = createBackup(SAMPLE_HISTORY, DEFAULT_SETTINGS, [])
    const json = serializeBackup(backup)
    const result = parseBackupJson(json)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.history).toEqual(SAMPLE_HISTORY)
      expect(result.data.settings).toEqual(DEFAULT_SETTINGS)
    }
  })
})

describe('createBackup / serializeBackup / parseBackupJson roundtrip（新3モード）', () => {
  it('spatial/pattern/toneモードの履歴も正しく往復できる', () => {
    const history: HistoryEntry[] = [
      { mode: 'spatial', level: 1, correct: 3, total: 3, timestamp: '2026-08-01T00:00:00.000Z' },
      { mode: 'pattern', level: 2, correct: 2, total: 3, timestamp: '2026-08-01T01:00:00.000Z' },
      { mode: 'tone', level: 3, correct: 1, total: 3, timestamp: '2026-08-01T02:00:00.000Z' },
    ]
    const result = parseBackupJson(
      serializeBackup(createBackup(history, DEFAULT_SETTINGS, [])),
    )
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.history).toEqual(history)
  })
})

describe('createBackup / serializeBackup / parseBackupJson roundtrip（DualN-Back・ランダム）', () => {
  it('dual-nback/randomモードの履歴も正しく往復できる', () => {
    const history: HistoryEntry[] = [
      { mode: 'dual-nback', level: 2, correct: 30, total: 40, timestamp: '2026-08-01T01:00:00.000Z' },
      { mode: 'random', level: 3, correct: 4, total: 5, timestamp: '2026-08-01T02:00:00.000Z' },
    ]
    const result = parseBackupJson(
      serializeBackup(createBackup(history, DEFAULT_SETTINGS, [])),
    )
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.history).toEqual(history)
  })
})

describe('missionCompletions往復', () => {
  it('missionCompletionsを含めて往復できる', () => {
    const completions = [{ dateKey: '2026-08-01', missionId: 'digit-2' }]
    const result = parseBackupJson(
      serializeBackup(createBackup([], DEFAULT_SETTINGS, completions)),
    )
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.missionCompletions).toEqual(completions)
  })

  it('v1バックアップ(missionCompletionsフィールド無し)は空配列として扱う', () => {
    const raw = JSON.stringify({ history: [], settings: DEFAULT_SETTINGS })
    const result = parseBackupJson(raw)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.missionCompletions).toEqual([])
  })
})

describe('parseBackupJson', () => {
  it('rejects invalid JSON', () => {
    const result = parseBackupJson('not json')
    expect(result.ok).toBe(false)
  })

  it('rejects non-object JSON', () => {
    expect(parseBackupJson('42').ok).toBe(false)
    expect(parseBackupJson('null').ok).toBe(false)
    expect(parseBackupJson('[]').ok).toBe(false)
  })

  it('rejects a history entry with an invalid mode', () => {
    const raw = JSON.stringify({
      history: [{ mode: 'invalid', level: 1, correct: 1, total: 1, timestamp: '2026-08-01T00:00:00.000Z' }],
      settings: DEFAULT_SETTINGS,
    })
    expect(parseBackupJson(raw).ok).toBe(false)
  })

  it('rejects a history entry with an invalid level', () => {
    const raw = JSON.stringify({
      history: [{ mode: 'word', level: 9, correct: 1, total: 1, timestamp: '2026-08-01T00:00:00.000Z' }],
      settings: DEFAULT_SETTINGS,
    })
    expect(parseBackupJson(raw).ok).toBe(false)
  })

  it('rejects a history entry with an invalid timestamp', () => {
    const raw = JSON.stringify({
      history: [{ mode: 'word', level: 1, correct: 1, total: 1, timestamp: 'not-a-date' }],
      settings: DEFAULT_SETTINGS,
    })
    expect(parseBackupJson(raw).ok).toBe(false)
  })

  it('rejects missing settings', () => {
    const raw = JSON.stringify({ history: [] })
    expect(parseBackupJson(raw).ok).toBe(false)
  })

  it('fills missing settings fields with defaults', () => {
    const raw = JSON.stringify({ history: [], settings: { soundEnabled: false } })
    const result = parseBackupJson(raw)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.settings).toEqual({ ...DEFAULT_SETTINGS, soundEnabled: false })
    }
  })

  it('accepts an empty history array', () => {
    const raw = JSON.stringify({ history: [], settings: DEFAULT_SETTINGS })
    expect(parseBackupJson(raw).ok).toBe(true)
  })
})

describe('backupFileName', () => {
  it('formats as gyaku-fukushou-backup-YYYYMMDD.json', () => {
    expect(backupFileName(new Date(2026, 7, 1))).toBe(
      'gyaku-fukushou-backup-20260801.json',
    )
  })
})
