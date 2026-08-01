import type { IncomingMessage, ServerResponse } from 'node:http'
import { getKV } from '../_lib/kv.js'
import { subscriptionKey } from '../_lib/subscription.js'
import { readJsonBody, sendEmpty } from '../_lib/http.js'

interface UnsubscribeBody {
  endpoint: string
}

function isValidUnsubscribeBody(value: unknown): value is UnsubscribeBody {
  if (typeof value !== 'object' || value === null) return false
  return typeof (value as Record<string, unknown>).endpoint === 'string'
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
  if (!isValidUnsubscribeBody(body)) return sendEmpty(res, 400)

  // 存在しなくても204を返す（べき等・購読状況を外部に漏らさないため）
  await getKV().del(subscriptionKey(body.endpoint))
  sendEmpty(res, 204)
}
