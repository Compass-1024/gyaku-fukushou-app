import { ACHIEVEMENTS } from './achievements'
import { loadMissionCompletions, MISSION_DEFINITIONS } from './missions'
import type { AchievementId } from './achievements'
import type { HistoryEntry } from '../types'

// ④-10: 実績・達成の通知センター。実績・ミッションとも「解除済みフラグ」を
// 永続化しない設計（派生できるものは保存しない方針）のため、いつ解除された
// かの記録も無い。実績については履歴を古い順に1件ずつ増やしながら
// isUnlockedを再評価し、falseからtrueに転じた瞬間の履歴エントリの日時を
// 「解除日」として近似する。ストリーク系・成長中実績はgetStreakDays/
// getAllBenchmarksが常に「実行時点の現在時刻」を基準にするため、この近似は
// 過去の実際の解除日と多少ずれうるが、実用上は十分な目安になる

export type NotificationEntry =
  | { kind: 'achievement'; achievementId: AchievementId; timestamp: string }
  | { kind: 'mission'; missionId: string; dateKey: string }

export function getAchievementUnlockLog(
  history: HistoryEntry[],
  missionCompletionCount: number,
): { achievementId: AchievementId; timestamp: string }[] {
  const sorted = history
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const results: { achievementId: AchievementId; timestamp: string }[] = []
  const found = new Set<AchievementId>()

  for (let i = 1; i <= sorted.length; i++) {
    if (found.size === ACHIEVEMENTS.length) break
    const prefix = sorted.slice(0, i)
    for (const achievement of ACHIEVEMENTS) {
      if (found.has(achievement.id)) continue
      if (achievement.isUnlocked(prefix, missionCompletionCount)) {
        found.add(achievement.id)
        results.push({ achievementId: achievement.id, timestamp: sorted[i - 1].timestamp })
      }
    }
  }
  return results
}

// ミッション達成ログはdateKey付きで既に記録されているため近似不要
export function getMissionCompletionLog(): { missionId: string; dateKey: string }[] {
  return loadMissionCompletions().map((c) => ({ missionId: c.missionId, dateKey: c.dateKey }))
}

export function findMissionDefinition(missionId: string) {
  return MISSION_DEFINITIONS.find((m) => m.id === missionId)
}

// 実績（timestamp）とミッション達成（dateKeyのみ）を統合し、新しい順に並べる。
// ソート単位が日付までしかないミッション側は、その日の23:59:59として扱う
export function getCombinedNotificationLog(
  history: HistoryEntry[],
  missionCompletionCount: number,
): NotificationEntry[] {
  const achievementEntries: NotificationEntry[] = getAchievementUnlockLog(
    history,
    missionCompletionCount,
  ).map((e) => ({ kind: 'achievement', achievementId: e.achievementId, timestamp: e.timestamp }))

  const missionEntries: NotificationEntry[] = getMissionCompletionLog().map((c) => ({
    kind: 'mission',
    missionId: c.missionId,
    dateKey: c.dateKey,
  }))

  function sortKey(entry: NotificationEntry): number {
    return entry.kind === 'achievement'
      ? new Date(entry.timestamp).getTime()
      : new Date(`${entry.dateKey}T23:59:59`).getTime()
  }

  return [...achievementEntries, ...missionEntries].sort((a, b) => sortKey(b) - sortKey(a))
}
