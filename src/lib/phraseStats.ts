const STORAGE_KEY = 'gyaku-fukushou:phraseStats'

export interface PhraseStat {
  correct: number
  total: number
}

export type PhraseStats = Record<string, PhraseStat>

// 誤答が多いフレーズほど再出題されやすくなるよう重みを増やす係数。
// 未挑戦のフレーズは標準ウェイト(1)とし、既知フレーズより優先も劣後もしない。
const WEAK_PHRASE_FACTOR = 3

export function loadPhraseStats(): PhraseStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed as PhraseStats
  } catch {
    return {}
  }
}

export function recordPhraseAttempt(phraseId: string, correct: boolean): void {
  try {
    const stats = loadPhraseStats()
    const prev = stats[phraseId] ?? { correct: 0, total: 0 }
    stats[phraseId] = {
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    /* localStorage利用不可（プライベートモード等）は無視 */
  }
}

export function getPhraseWeight(stats: PhraseStats, phraseId: string): number {
  const stat = stats[phraseId]
  if (!stat || stat.total === 0) return 1
  const errorRate = 1 - stat.correct / stat.total
  return 1 + errorRate * WEAK_PHRASE_FACTOR
}
