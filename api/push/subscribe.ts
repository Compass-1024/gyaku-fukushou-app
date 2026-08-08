import type { IncomingMessage, ServerResponse } from 'node:http'
import { getKV } from '../_lib/kv.js'
import { subscriptionKey } from '../_lib/subscription.js'
import type { PushSubscriptionJSON, StoredSubscription } from '../_lib/subscription.js'
import { getClientIp, readJsonBody, sendEmpty } from '../_lib/http.js'
import { isRateLimited } from '../_lib/rateLimit.js'

// 購読は端末ごとに頻繁には起きない操作のため、10分あたり10回で十分
const RATE_LIMIT = 10
const RATE_LIMIT_WINDOW_SECONDS = 600

interface SubscribeBody {
  subscription: PushSubscriptionJSON
  language?: 'ja' | 'en'
}

function isValidSubscribeBody(value: unknown): value is SubscribeBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  const sub = v.subscription as Record<string, unknown> | undefined
  if (typeof sub !== 'object' || sub === null) return false
  if (typeof sub.endpoint !== 'string') return false
  const keys = sub.keys as Record<string, unknown> | undefined
  if (typeof keys !== 'object' || keys === null) return false
  if (typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') return false
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
    'push-subscribe',
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
  if (!isValidSubscribeBody(body)) return sendEmpty(res, 400)

  const record: StoredSubscription = {
    subscription: body.subscription,
    lastPracticedDateKey: null,
    lastReminderSentDateKey: null,
    language: body.language ?? 'ja',
    updatedAt: new Date().toISOString(),
  }
  await kv.set(subscriptionKey(body.subscription.endpoint), record)
  sendEmpty(res, 204)
}
