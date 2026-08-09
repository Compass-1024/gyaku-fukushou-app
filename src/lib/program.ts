import { localDateKey } from './history'
import type { HistoryEntry } from '../types'

// ④-4: 「今日のミッション」が単日完結の目標なのに対し、複数日にまたがる
// 目標を可視化する「7日間チャレンジ」。固定の開始日を持つプログラムでは
// なく常に「直近7日間のうち何日プレイしたか」を示すローリングウィンドウ
// 方式にすることで、いつアプリを開いても現在の進捗がそのまま意味を持つ
// （実績・XP等と同じ「派生できるものは保存しない」方針を踏襲し、専用の
// 永続ストアは持たない）
export const PROGRAM_LENGTH_DAYS = 7

export interface ProgramProgress {
  daysPlayed: number
  totalDays: number
  isComplete: boolean
}

export function getRollingProgramProgress(
  history: HistoryEntry[],
  now: Date = new Date(),
  // fix③-5: デイリーチャレンジ等、historyには記録されないが「その日に
  // 取り組んだ」とみなしたい日付キーの集合
  extraPlayedDateKeys: ReadonlySet<string> = new Set(),
): ProgramProgress {
  const windowKeys = new Set<string>()
  for (let i = 0; i < PROGRAM_LENGTH_DAYS; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    windowKeys.add(localDateKey(d))
  }
  const playedDays = new Set<string>()
  for (const entry of history) {
    const key = localDateKey(new Date(entry.timestamp))
    if (windowKeys.has(key)) playedDays.add(key)
  }
  for (const key of extraPlayedDateKeys) {
    if (windowKeys.has(key)) playedDays.add(key)
  }
  return {
    daysPlayed: playedDays.size,
    totalDays: PROGRAM_LENGTH_DAYS,
    isComplete: playedDays.size >= PROGRAM_LENGTH_DAYS,
  }
}
