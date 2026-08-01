import { getKV } from '../_lib/kv.js'
import { subscriptionKey } from '../_lib/subscription.js'

interface UnsubscribeBody {
  endpoint: string
}

function isValidUnsubscribeBody(value: unknown): value is UnsubscribeBody {
  if (typeof value !== 'object' || value === null) return false
  return typeof (value as Record<string, unknown>).endpoint === 'string'
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }
  if (!isValidUnsubscribeBody(body)) return new Response(null, { status: 400 })

  // 存在しなくても204を返す（べき等・購読状況を外部に漏らさないため）
  await getKV().del(subscriptionKey(body.endpoint))
  return new Response(null, { status: 204 })
}
