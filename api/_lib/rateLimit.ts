import type { KVStore } from './kv.js'

// 固定ウィンドウ方式の簡易レート制限。認証を持たない匿名POSTエンドポイント
// （api/push/*）が大量リクエストでRedisの無料枠を消費し尽くす「コストDoS」を
// 防ぐための最小限の防御。IP単位・エンドポイント単位でカウンタを分ける
export async function isRateLimited(
  kv: KVStore,
  bucket: string,
  ip: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = `ratelimit:${bucket}:${ip}`
  const count = await kv.incrWithExpiry(key, windowSeconds)
  return count > limit
}
