import { getKV } from '../_lib/kv.js'
import { subscriptionKey } from '../_lib/subscription.js'
import type { StoredSubscription } from '../_lib/subscription.js'

interface SettingsBody {
  endpoint: string
  notifyHourJst: number
}

function isValidSettingsBody(value: unknown): value is SettingsBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.endpoint === 'string' &&
    typeof v.notifyHourJst === 'number' &&
    v.notifyHourJst >= 0 &&
    v.notifyHourJst <= 23
  )
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }
  if (!isValidSettingsBody(body)) return new Response(null, { status: 400 })

  const kv = getKV()
  const key = subscriptionKey(body.endpoint)
  const existing = await kv.get<StoredSubscription>(key)
  if (!existing) return new Response(null, { status: 404 })

  const updated: StoredSubscription = {
    ...existing,
    notifyHourJst: body.notifyHourJst,
    updatedAt: new Date().toISOString(),
  }
  await kv.set(key, updated)
  return new Response(null, { status: 204 })
}
