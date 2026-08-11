// 今日のミッション（v2）: 過去の正答率から自動選定した「弱点」モード・レベルを
// 1日3セット達成すると+100XP。旧`missions.ts`（日替わりハッシュ選出の固定9種）は
// ホーム画面から撤去したがコードは残しており、この新ミッションとは独立に動作
// し続ける（両者は同じ`missionCompletions`ログを共有するが、missionIdが異なる
// ため二重判定にはならない）。
import { localDateKey, getWeakestAreas } from './history'
import { loadMissionCompletions, replaceMissionCompletions } from './missions'
import type { DigitGameType, HistoryEntry, Language, Level, Mode } from '../types'

export interface DailyMissionTarget {
  mode: Mode
  level: Level
  gameType?: DigitGameType
}

export const DAILY_MISSION_REQUIRED_SETS = 3
export const DAILY_MISSION_ID = 'daily-target'

interface StoredTarget extends DailyMissionTarget {
  dateKey: string
}

const TARGETS_KEY = 'gyaku-fukushou:dailyMissionTargets'
const MAX_TARGETS = 60

const VALID_MODES: readonly Mode[] = [
  'word',
  'digit',
  'nback',
  'dual-nback',
  'spatial',
  'pattern',
  'tone',
  'random',
]

function isValidStoredTarget(value: unknown): value is StoredTarget {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.dateKey === 'string' &&
    typeof v.mode === 'string' &&
    (VALID_MODES as string[]).includes(v.mode) &&
    (v.level === 1 || v.level === 2 || v.level === 3) &&
    (v.gameType === undefined || v.gameType === 'reverse' || v.gameType === 'sum')
  )
}

function loadTargets(): StoredTarget[] {
  try {
    const raw = localStorage.getItem(TARGETS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidStoredTarget)
  } catch {
    return []
  }
}

function saveTargets(targets: StoredTarget[]): void {
  try {
    localStorage.setItem(TARGETS_KEY, JSON.stringify(targets.slice(-MAX_TARGETS)))
  } catch {
    /* localStorage利用不可（プライベートモード等）は無視 */
  }
}

// 挑戦履歴が無い新規ユーザー向けの既定ターゲット（すうじ・逆から入力レベル1）
const FALLBACK_TARGET: DailyMissionTarget = { mode: 'digit', level: 1, gameType: 'reverse' }

function pickTarget(history: HistoryEntry[], language: Language): DailyMissionTarget {
  // 英語版ではことばモードを選べないため、TopScreen.tsxの「今日のおすすめ」と
  // 同じ考え方でスキップする（十分な件数を取得してからフィルタする）
  const weakest = getWeakestAreas(history, language === 'en' ? 9 : 1).find(
    (area) => language === 'ja' || area.mode !== 'word',
  )
  if (!weakest) return FALLBACK_TARGET
  return { mode: weakest.mode, level: weakest.level, gameType: weakest.gameType }
}

// その日のターゲットを取得する。同じ日は常に同じターゲットを返す（挑戦を進める
// うちに弱点の順位が入れ替わり、目標が日中に動いてしまうのを防ぐため、初回
// 判定時点のターゲットをその日のうちは固定する）
export function getDailyMissionTarget(
  history: HistoryEntry[],
  language: Language,
  now: Date = new Date(),
): DailyMissionTarget {
  const dateKey = localDateKey(now)
  const targets = loadTargets()
  const today = targets.find((t) => t.dateKey === dateKey)
  if (today) return { mode: today.mode, level: today.level, gameType: today.gameType }
  const picked = pickTarget(history, language)
  saveTargets([...targets, { dateKey, ...picked }])
  return picked
}

function matchesTarget(entry: HistoryEntry, target: DailyMissionTarget): boolean {
  return (
    entry.mode === target.mode &&
    entry.level === target.level &&
    entry.gameType === target.gameType
  )
}

// 指定日にターゲットと同じモード・レベルで完了したセット数
function countSetsForDate(
  history: HistoryEntry[],
  target: DailyMissionTarget,
  dateKey: string,
): number {
  return history.filter(
    (e) => localDateKey(new Date(e.timestamp)) === dateKey && matchesTarget(e, target),
  ).length
}

export function getDailyMissionProgress(
  history: HistoryEntry[],
  target: DailyMissionTarget,
  now: Date = new Date(),
): number {
  return countSetsForDate(history, target, localDateKey(now))
}

export function isDailyMissionComplete(
  history: HistoryEntry[],
  target: DailyMissionTarget,
  now: Date = new Date(),
): boolean {
  return getDailyMissionProgress(history, target, now) >= DAILY_MISSION_REQUIRED_SETS
}

// セット完了直後に呼ぶ。missions.tsの`missionCompletions`ログを共有し、
// 同じ日に複数回達成判定されても二重付与しない（missionIdをキーに1日1回のみ）
export function checkAndRecordDailyMissionCompletion(
  historyBefore: HistoryEntry[],
  historyAfter: HistoryEntry[],
  target: DailyMissionTarget,
  now: Date = new Date(),
): boolean {
  const dateKey = localDateKey(now)
  const completions = loadMissionCompletions()
  const alreadyRecorded = completions.some(
    (c) => c.dateKey === dateKey && c.missionId === DAILY_MISSION_ID,
  )
  if (alreadyRecorded) return false
  const before = countSetsForDate(historyBefore, target, dateKey)
  const after = countSetsForDate(historyAfter, target, dateKey)
  if (before >= DAILY_MISSION_REQUIRED_SETS || after < DAILY_MISSION_REQUIRED_SETS) return false
  replaceMissionCompletions([...completions, { dateKey, missionId: DAILY_MISSION_ID }])
  return true
}
