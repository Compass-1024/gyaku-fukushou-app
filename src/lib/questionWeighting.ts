// すうじ/順唱/空間/変化検出/音・色の5モード向けの出題重み付け抽選。
// ことばモード（phraseStats.ts）はフレーズという固定候補プールを持つため
// フレーズ単位で重み付けできるが、この5モードは固定プールを持たずその場で
// 乱数生成する方式のため、代わりに「生成した系列パターンを粗い特徴（バケット）に
// 分類し、バケット単位の正誤統計を蓄積する」方式を取る。出題時は複数の候補を
// 生成し、苦手なバケットに属する候補ほど選ばれやすい重み付き抽選で1件を選ぶ。

export interface BucketStat {
  correct: number
  total: number
}

export type BucketStats = Record<string, BucketStat>

// 誤答が多いバケットほど再出題されやすくなるよう重みを増やす係数。
// 未挑戦のバケットは標準ウェイト(1)とし、既知バケットより優先も劣後もしない。
// （phraseStats.tsのWEAK_PHRASE_FACTORと同じ考え方・同じ値）
const WEAK_BUCKET_FACTOR = 3

// 1問ごとに生成する候補数。多いほど重み付けが効きやすくなるが生成コストも増える
const DEFAULT_CANDIDATE_COUNT = 5

function storageKey(mode: string): string {
  return `gyaku-fukushou:questionStats:${mode}`
}

function isValidBucketStat(value: unknown): value is BucketStat {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.correct === 'number' &&
    Number.isFinite(v.correct) &&
    v.correct >= 0 &&
    typeof v.total === 'number' &&
    Number.isFinite(v.total) &&
    v.total >= 0 &&
    v.correct <= v.total
  )
}

export function loadBucketStats(mode: string): BucketStats {
  try {
    const raw = localStorage.getItem(storageKey(mode))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const result: BucketStats = {}
    for (const [bucket, stat] of Object.entries(parsed as Record<string, unknown>)) {
      if (isValidBucketStat(stat)) result[bucket] = stat
    }
    return result
  } catch {
    return {}
  }
}

export function recordBucketAttempt(
  mode: string,
  bucket: string,
  correct: boolean,
): void {
  try {
    const stats = loadBucketStats(mode)
    const prev = stats[bucket] ?? { correct: 0, total: 0 }
    stats[bucket] = {
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }
    localStorage.setItem(storageKey(mode), JSON.stringify(stats))
  } catch {
    /* localStorage利用不可（プライベートモード等）は無視 */
  }
}

export function getBucketWeight(stats: BucketStats, bucket: string): number {
  const stat = stats[bucket]
  if (!stat || stat.total === 0) return 1
  const errorRate = 1 - stat.correct / stat.total
  return 1 + errorRate * WEAK_BUCKET_FACTOR
}

// generateで候補を複数生成し、classifyで求めたバケットの重みに応じた
// 重み付き抽選で1件を選ぶ
export function pickWeightedCandidate<T>(
  generate: () => T,
  classify: (item: T) => string,
  stats: BucketStats,
  candidateCount: number = DEFAULT_CANDIDATE_COUNT,
): T {
  const candidates = Array.from({ length: candidateCount }, () => generate())
  const weights = candidates.map((c) => getBucketWeight(stats, classify(c)))
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let r = Math.random() * totalWeight
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]
    if (r <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}
