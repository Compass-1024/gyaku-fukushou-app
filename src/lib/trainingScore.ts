import type { DigitGameType, HistoryEntry, Language, Mode } from '../types'

// 統計画面のシンプル化: 個別モードの正答率推移グラフ・9エリアのベンチマーク
// グリッドを、分かりやすい4つの数字（総合トレーニングスコア＋3カテゴリ）に
// 置き換える。カテゴリ分けは記憶の対象が近いモードをまとめたもの:
// - 数字記憶: ことば・すうじ（逆から入力・合計を入力）
// - 空間記憶: 空間・変化検出・Nバック（位置ベースの空間版N-back）
// - 注意制御: デュアルNバック・音・色・ランダム（複数の情報を同時に扱う課題）
export type ScoreCategory = 'overall' | 'numeric' | 'spatial' | 'attention'

interface CategoryMember {
  mode: Mode
  gameType?: DigitGameType
}

const CATEGORY_MEMBERS: Record<Exclude<ScoreCategory, 'overall'>, CategoryMember[]> = {
  numeric: [
    { mode: 'word' },
    { mode: 'digit', gameType: 'reverse' },
    { mode: 'digit', gameType: 'sum' },
  ],
  spatial: [{ mode: 'spatial' }, { mode: 'pattern' }, { mode: 'nback' }],
  attention: [{ mode: 'dual-nback' }, { mode: 'tone' }, { mode: 'random' }],
}

export interface CategoryScoreResult {
  category: ScoreCategory
  // 直近半分の正答率（%）。挑戦履歴が無ければnull
  score: number | null
  // それ以前の半分の正答率（%）。前半/後半に分けるのに十分な件数が
  // 無ければnull（この場合scoreは全履歴の正答率になる）
  previousScore: number | null
  // score - previousScore。previousScoreがnullならnull
  delta: number | null
}

// 前半・後半それぞれに最低限必要な件数（1回のたまたまの結果で
// 過大評価しないよう、苦手分野判定・ベンチマークと同じ考え方）
const MIN_ATTEMPTS_PER_HALF = 2

function accuracyOf(entries: HistoryEntry[]): number {
  const correctSum = entries.reduce((sum, e) => sum + e.correct, 0)
  const totalSum = entries.reduce((sum, e) => sum + e.total, 0)
  return totalSum > 0 ? Math.round((correctSum / totalSum) * 100) : 0
}

function sortByTime(entries: HistoryEntry[]): HistoryEntry[] {
  return entries
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

function computeScore(category: ScoreCategory, entries: HistoryEntry[]): CategoryScoreResult {
  const sorted = sortByTime(entries)
  if (sorted.length === 0) {
    return { category, score: null, previousScore: null, delta: null }
  }
  if (sorted.length < MIN_ATTEMPTS_PER_HALF * 2) {
    return { category, score: accuracyOf(sorted), previousScore: null, delta: null }
  }
  const mid = Math.floor(sorted.length / 2)
  const earlier = sorted.slice(0, mid)
  const later = sorted.slice(mid)
  const score = accuracyOf(later)
  const previousScore = accuracyOf(earlier)
  return { category, score, previousScore, delta: score - previousScore }
}

function matchesCategory(entry: HistoryEntry, members: CategoryMember[]): boolean {
  return members.some((m) => m.mode === entry.mode && m.gameType === entry.gameType)
}

export interface TrainingScores {
  overall: CategoryScoreResult
  numeric: CategoryScoreResult
  spatial: CategoryScoreResult
  attention: CategoryScoreResult
}

// 英語版ではことばモードを選べないため、数字記憶カテゴリから除外する
export function getTrainingScores(history: HistoryEntry[], language: Language): TrainingScores {
  const numericMembers = CATEGORY_MEMBERS.numeric.filter(
    (m) => language === 'ja' || m.mode !== 'word',
  )
  return {
    overall: computeScore('overall', history),
    numeric: computeScore(
      'numeric',
      history.filter((e) => matchesCategory(e, numericMembers)),
    ),
    spatial: computeScore(
      'spatial',
      history.filter((e) => matchesCategory(e, CATEGORY_MEMBERS.spatial)),
    ),
    attention: computeScore(
      'attention',
      history.filter((e) => matchesCategory(e, CATEGORY_MEMBERS.attention)),
    ),
  }
}
