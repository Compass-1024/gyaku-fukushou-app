import { getKV } from '../_lib/kv.js'
import { subscriptionKey } from '../_lib/subscription.js'
import type { PushSubscriptionJSON, StoredSubscription } from '../_lib/subscription.js'

interface SubscribeBody {
  subscription: PushSubscriptionJSON
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
  return true
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }
  if (!isValidSubscribeBody(body)) return new Response(null, { status: 400 })

  const record: StoredSubscription = {
    subscription: body.subscription,
    lastPracticedDateKey: null,
    lastReminderSentDateKey: null,
    updatedAt: new Date().toISOString(),
  }
  await getKV().set(subscriptionKey(body.subscription.endpoint), record)
  return new Response(null, { status: 204 })
}
