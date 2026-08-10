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

export interface WeakestBucket {
  bucket: string
  accuracyPercent: number
}

// バケット別の統計を出題重み付け（内部利用）だけでなく、ユーザー自身への
// 「誤答パターンの質的フィードバック」（統計画面）にも二次利用する。
// レベル横断でバケット名（'repeat'/'adjacent'等）ごとに正誤を集計し、
// 最も正答率が低いバケットを返す。試行数が少ない、または他バケットとの
// 差が僅少な場合は「意味のある傾向」とみなさずnullを返す
const MIN_ATTEMPTS_FOR_WEAKNESS_SUMMARY = 3
const MIN_ACCURACY_GAP_FOR_WEAKNESS_SUMMARY = 15

export function getWeakestBucket(stats: BucketStats): WeakestBucket | null {
  const byBucket = new Map<string, BucketStat>()
  for (const [key, stat] of Object.entries(stats)) {
    const bucket = key.split(':')[1]
    if (!bucket) continue
    const prev = byBucket.get(bucket) ?? { correct: 0, total: 0 }
    byBucket.set(bucket, {
      correct: prev.correct + stat.correct,
      total: prev.total + stat.total,
    })
  }
  const summarized = Array.from(byBucket.entries())
    .filter(([, s]) => s.total >= MIN_ATTEMPTS_FOR_WEAKNESS_SUMMARY)
    .map(([bucket, s]) => ({
      bucket,
      accuracyPercent: Math.round((s.correct / s.total) * 100),
    }))
  if (summarized.length < 2) return null
  summarized.sort((a, b) => a.accuracyPercent - b.accuracyPercent)
  const worst = summarized[0]
  const best = summarized[summarized.length - 1]
  if (best.accuracyPercent - worst.accuracyPercent < MIN_ACCURACY_GAP_FOR_WEAKNESS_SUMMARY) {
    return null
  }
  return worst
}

// 除外候補との一致判定を1件あたり最大何回まで再生成してリトライするか。
// 候補空間（数字列・マス系列等）は十分広いため、数回のリトライで除外対象を
// 避けられなかった場合は諦めてそのまま採用する（無限ループ防止）
const MAX_EXCLUDE_REGEN_ATTEMPTS = 10

function defaultIsEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// generateで候補を複数生成し、classifyで求めたバケットの重みに応じた
// 重み付き抽選で1件を選ぶ。excludeを渡すと、そのいずれかとisEqualで一致する
// 候補は（可能な範囲で）避けて再生成する。「モードを途中でやめて再挑戦した際に
// 直前に表示済みだった問題を除外する」用途で使う
export function pickWeightedCandidate<T>(
  generate: () => T,
  classify: (item: T) => string,
  stats: BucketStats,
  candidateCount: number = DEFAULT_CANDIDATE_COUNT,
  exclude: T[] = [],
  isEqual: (a: T, b: T) => boolean = defaultIsEqual,
): T {
  const candidates = Array.from({ length: candidateCount }, () => {
    let candidate = generate()
    let attempts = 0
    while (
      exclude.length > 0 &&
      exclude.some((e) => isEqual(e, candidate)) &&
      attempts < MAX_EXCLUDE_REGEN_ATTEMPTS
    ) {
      candidate = generate()
      attempts += 1
    }
    return candidate
  })
  const weights = candidates.map((c) => getBucketWeight(stats, classify(c)))
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let r = Math.random() * totalWeight
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]
    if (r <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}
