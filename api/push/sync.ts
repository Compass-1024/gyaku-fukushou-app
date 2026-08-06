import type { IncomingMessage, ServerResponse } from 'node:http'
import { getKV } from '../_lib/kv.js'
import { subscriptionKey } from '../_lib/subscription.js'
import type { StoredSubscription } from '../_lib/subscription.js'
import { readJsonBody, sendEmpty } from '../_lib/http.js'

interface SyncBody {
  endpoint: string
  lastPracticedDateKey: string
  language?: 'ja' | 'en'
}

function isValidSyncBody(value: unknown): value is SyncBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v.endpoint !== 'string' || typeof v.lastPracticedDateKey !== 'string') {
    return false
  }
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

  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch {
    return sendEmpty(res, 400)
  }
  if (!isValidSyncBody(body)) return sendEmpty(res, 400)

  const kv = getKV()
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
