import { localDateKey } from './history'
import type { HistoryEntry, Language, Mode } from '../types'

export type MissionSpec =
  | { kind: 'playCount'; mode: Mode; count: number }
  | { kind: 'accuracy'; percent: number }

export interface MissionDefinition {
  id: string
  spec: MissionSpec
  // 英語版ではことばモードが選択できないため、対象にしない
  requiresWordMode?: boolean
  isComplete: (todayEntries: HistoryEntry[]) => boolean
}

function countMode(entries: HistoryEntry[], mode: Mode): number {
  return entries.filter((e) => e.mode === mode).length
}

function playCountMission(mode: Mode, count: number, requiresWordMode = false): MissionDefinition {
  return {
    id: `${mode}-${count}`,
    spec: { kind: 'playCount', mode, count },
    requiresWordMode,
    isComplete: (entries) => countMode(entries, mode) >= count,
  }
}

const ACCURACY_THRESHOLD = 80

export const MISSION_DEFINITIONS: MissionDefinition[] = [
  playCountMission('word', 2, true),
  playCountMission('digit', 2),
  playCountMission('sequence', 2),
  playCountMission('nback', 2),
  playCountMission('dual-nback', 2),
  playCountMission('spatial', 2),
  playCountMission('pattern', 2),
  playCountMission('tone', 2),
  playCountMission('random', 2),
  {
    id: `accuracy-${ACCURACY_THRESHOLD}`,
    spec: { kind: 'accuracy', percent: ACCURACY_THRESHOLD },
    isComplete: (entries) =>
      entries.some(
        (e) => e.total > 0 && Math.round((e.correct / e.total) * 100) >= ACCURACY_THRESHOLD,
      ),
  },
]

// dateKeyから決定的に1件選ぶ（同じ日は同じミッションになる。永続化不要）
function pickMissionForDate(dateKey: string, pool: MissionDefinition[]): MissionDefinition {
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0
  }
  return pool[hash % pool.length]
}

export function getTodayMission(
  language: Language,
  now: Date = new Date(),
): MissionDefinition {
  const pool =
    language === 'en'
      ? MISSION_DEFINITIONS.filter((m) => !m.requiresWordMode)
      : MISSION_DEFINITIONS
  return pickMissionForDate(localDateKey(now), pool)
}

function getTodayEntries(history: HistoryEntry[], now: Date): HistoryEntry[] {
  const todayKey = localDateKey(now)
  return history.filter((e) => localDateKey(new Date(e.timestamp)) === todayKey)
}

export function isTodayMissionComplete(
  history: HistoryEntry[],
  language: Language,
  now: Date = new Date(),
): boolean {
  return getTodayMission(language, now).isComplete(getTodayEntries(history, now))
}

export interface MissionCompletion {
  dateKey: string
  missionId: string
}

const COMPLETIONS_KEY = 'gyaku-fukushou:missionCompletions'
const MAX_COMPLETIONS = 200

export function loadMissionCompletions(): MissionCompletion[] {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function replaceMissionCompletions(entries: MissionCompletion[]): void {
  try {
    localStorage.setItem(
      COMPLETIONS_KEY,
      JSON.stringify(entries.slice(-MAX_COMPLETIONS)),
    )
  } catch {
    /* localStorage unavailable (private mode, quota, etc.) */
  }
}

function appendMissionCompletion(entry: MissionCompletion): void {
  replaceMissionCompletions([...loadMissionCompletions(), entry])
}

export function hasRecordedTodayCompletion(
  completions: MissionCompletion[],
  language: Language,
  now: Date = new Date(),
): boolean {
  const dateKey = localDateKey(now)
  const missionId = getTodayMission(language, now).id
  return completions.some((c) => c.dateKey === dateKey && c.missionId === missionId)
}

// 今日のミッションが（このセット完了時点で初めて）達成済みなら記録してボーナスXPを返す。
// 既に記録済み、または未達成なら0を返す
export function checkAndRecordMissionCompletion(
  history: HistoryEntry[],
  language: Language,
  now: Date = new Date(),
): number {
  const completions = loadMissionCompletions()
  if (hasRecordedTodayCompletion(completions, language, now)) return 0
  if (!isTodayMissionComplete(history, language, now)) return 0
  appendMissionCompletion({ dateKey: localDateKey(now), missionId: getTodayMission(language, now).id })
  return 1
}
