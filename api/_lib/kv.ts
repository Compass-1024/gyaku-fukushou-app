import { Redis } from '@upstash/redis'

// ストレージの実体（Vercel Marketplace経由のRedis連携、旧Vercel KV）を
// この1ファイルに閉じ込める。プロバイダを変更する場合はここだけ差し替える。
export interface KVStore {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  del(key: string): Promise<void>
  scanKeys(prefix: string): Promise<string[]>
  // 固定ウィンドウ方式のレート制限用カウンタ。キーが存在しなければ1に初期化し
  // ttlSeconds後に自動失効させ、存在すればインクリメントした値を返す
  incrWithExpiry(key: string, ttlSeconds: number): Promise<number>
}

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    // fromEnv() は UPSTASH_REDIS_REST_URL/TOKEN と、互換用の
    // KV_REST_API_URL/TOKEN のどちらの命名規則にも対応している
    redis = Redis.fromEnv()
  }
  return redis
}

export function getKV(): KVStore {
  const client = getRedis()
  return {
    async get<T>(key: string): Promise<T | null> {
      return client.get<T>(key)
    },
    async set<T>(key: string, value: T): Promise<void> {
      await client.set(key, value)
    },
    async del(key: string): Promise<void> {
      await client.del(key)
    },
    async scanKeys(prefix: string): Promise<string[]> {
      // KEYSはRedisをブロックしうるため、SCANのカーソル走査で分割取得する
      const keys: string[] = []
      let cursor = 0
      do {
        const [nextCursor, batch] = await client.scan(cursor, {
          match: `${prefix}*`,
          count: 200,
        })
        keys.push(...batch)
        cursor = Number(nextCursor)
      } while (cursor !== 0)
      return keys
    },
    async incrWithExpiry(key: string, ttlSeconds: number): Promise<number> {
      const count = await client.incr(key)
      if (count === 1) {
        await client.expire(key, ttlSeconds)
      }
      return count
    },
  }
}
