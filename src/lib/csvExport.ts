import type { HistoryEntry } from '../types'

// ④-3: バックアップ(JSON、復元専用)とは別に、表計算ソフトで分析したい
// ユーザー向けにCSV形式でも書き出せるようにする。往復（インポート）は
// 想定しない読み取り専用のエクスポートのため、backup.tsとは独立させている
const CSV_HEADER = ['timestamp', 'mode', 'gameType', 'level', 'correct', 'total', 'accuracyPercent']

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildHistoryCsv(history: HistoryEntry[]): string {
  const rows = history.map((e) => {
    const accuracyPercent = e.total > 0 ? Math.round((e.correct / e.total) * 100) : ''
    return [
      e.timestamp,
      e.mode,
      e.gameType ?? '',
      String(e.level),
      String(e.correct),
      String(e.total),
      String(accuracyPercent),
    ]
      .map(escapeCsvField)
      .join(',')
  })
  return [CSV_HEADER.join(','), ...rows].join('\n')
}

export function historyCsvFileName(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `gyaku-fukushou-history-${y}${m}${d}.csv`
}
