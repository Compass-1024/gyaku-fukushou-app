import type { IncomingMessage, ServerResponse } from 'node:http'
// web-pushはCommonJSパッケージで、Vercel FunctionsのESM環境では名前付き
// importが解決できないことがあるため、default importしてから分割する
import webpush from 'web-push'
import { getKV } from '../_lib/kv.js'
import { shouldSendReminder, buildReminderMessage, getJstDateKey } from '../_lib/reminder.js'
import { SUBSCRIPTION_KEY_PREFIX } from '../_lib/subscription.js'
import type { StoredSubscription } from '../_lib/subscription.js'
import { getHeader, sendJson } from '../_lib/http.js'

const { sendNotification, setVapidDetails, WebPushError } = webpush

function isVapidConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  )
}

// Vercel Cronからのリクエスト、または手動テスト用にCRON_SECRETをBearerトークンで
// 渡した呼び出しのみ受け付ける
function isAuthorized(req: IncomingMessage): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return getHeader(req, 'authorization') === `Bearer ${secret}`
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!isAuthorized(req)) {
    return sendJson(res, 401, { error: 'unauthorized' })
  }
  if (!isVapidConfigured()) {
    return sendJson(res, 500, {
      error: 'VAPID environment variables are not configured',
    })
  }

  setVapidDetails(
    process.env.VAPID_SUBJECT as string,
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  )

  const kv = getKV()
  const keys = await kv.scanKeys(SUBSCRIPTION_KEY_PREFIX)
  const nowUtc = new Date()
  const todayKey = getJstDateKey(nowUtc)

  let sent = 0
  let deleted = 0
  let errored = 0

  for (const key of keys) {
    const record = await kv.get<StoredSubscription>(key)
    if (!record) continue

    const send = shouldSendReminder({
      lastPracticedDateKey: record.lastPracticedDateKey,
      lastReminderSentDateKey: record.lastReminderSentDateKey,
      nowUtc,
    })
    if (!send) continue

    try {
      const message = buildReminderMessage(record.language ?? 'ja')
      await sendNotification(record.subscription, JSON.stringify(message))
      sent += 1
      await kv.set(key, {
        ...record,
        lastReminderSentDateKey: todayKey,
        updatedAt: nowUtc.toISOString(),
      })
    } catch (error) {
      if (
        error instanceof WebPushError &&
        (error.statusCode === 404 || error.statusCode === 410)
      ) {
        // 購読が失効している（ブラウザ側で解除済み等）ため削除する
        await kv.del(key)
        deleted += 1
      } else {
        errored += 1
        console.error('[cron/reminder] failed to send push notification', error)
      }
    }
  }

  sendJson(res, 200, { sent, deleted, errored })
}
