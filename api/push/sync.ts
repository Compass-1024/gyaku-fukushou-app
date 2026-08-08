import type { IncomingMessage, ServerResponse } from 'node:http'
import { getKV } from '../_lib/kv.js'
import { subscriptionKey } from '../_lib/subscription.js'
import type { StoredSubscription } from '../_lib/subscription.js'
import { getClientIp, readJsonBody, sendEmpty } from '../_lib/http.js'
import { isRateLimited } from '../_lib/rateLimit.js'

// セット完了ごとに呼ばれるため、他のpushエンドポイントより緩めに設定する
const RATE_LIMIT = 60
const RATE_LIMIT_WINDOW_SECONDS = 3600

interface SyncBody {
  endpoint: string
  lastPracticedDateKey: string
  language?: 'ja' | 'en'
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidSyncBody(value: unknown): value is SyncBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v.endpoint !== 'string' || typeof v.lastPracticedDateKey !== 'string') {
    return false
  }
  if (!DATE_KEY_PATTERN.test(v.lastPracticedDateKey)) return false
  if (v.language !== undefined && v.language !== 'ja' && v.language !== 'en') {
    return false
  }
  return true
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') return sendEmpty(res, 405)

  const kv = getKV()
  const limited = await isRateLimited(
    kv,
    'push-sync',
    getClientIp(req),
    RATE_LIMIT,
    RATE_LIMIT_WINDOW_SECONDS,
  )
  if (limited) return sendEmpty(res, 429)

  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch {
    return sendEmpty(res, 400)
  }
  if (!isValidSyncBody(body)) return sendEmpty(res, 400)

  const key = subscriptionKey(body.endpoint)
  const existing = await kv.get<StoredSubscription>(key)
  if (!existing) return sendEmpty(res, 404)

  const updated: StoredSubscription = {
    ...existing,
    lastPracticedDateKey: body.lastPracticedDateKey,
    language: body.language ?? existing.language,
    updatedAt: new Date().toISOString(),
  }
  await kv.set(key, updated)
  sendEmpty(res, 204)
}
