import { createHash } from 'node:crypto'

export interface PushSubscriptionJSON {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface StoredSubscription {
  subscription: PushSubscriptionJSON
  lastPracticedDateKey: string | null
  lastReminderSentDateKey: string | null
  updatedAt: string
}

const KEY_PREFIX = 'push:sub:'

export function subscriptionKey(endpoint: string): string {
  const hash = createHash('sha256').update(endpoint).digest('hex')
  return `${KEY_PREFIX}${hash}`
}

export function isSubscriptionKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX)
}

export const SUBSCRIPTION_KEY_PREFIX = KEY_PREFIX
