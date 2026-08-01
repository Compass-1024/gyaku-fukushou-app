// プッシュ通知リマインダーの送信判定・メッセージ生成ロジック。
// src/lib/reminder.ts の複製（Vercel Functionsのビルドをsrc/側の
// tsconfig/DOM libから独立させるため）。片方を変更したらもう一方も更新すること。

const JST_OFFSET_MS = 9 * 60 * 60 * 1000

function toJstDate(date: Date): Date {
  return new Date(date.getTime() + JST_OFFSET_MS)
}

export function getJstDateKey(date: Date): string {
  const jst = toJstDate(date)
  const y = jst.getUTCFullYear()
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0')
  const d = String(jst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getJstHour(date: Date): number {
  return toJstDate(date).getUTCHours()
}

export interface ReminderCheckInput {
  lastPracticedDateKey: string | null
  lastReminderSentDateKey: string | null
  notifyHourJst: number
  nowUtc: Date
}

export function shouldSendReminder(input: ReminderCheckInput): boolean {
  const todayKey = getJstDateKey(input.nowUtc)
  if (getJstHour(input.nowUtc) !== input.notifyHourJst) return false
  if (input.lastPracticedDateKey === todayKey) return false
  if (input.lastReminderSentDateKey === todayKey) return false
  return true
}

export interface ReminderMessage {
  title: string
  body: string
}

export function buildReminderMessage(): ReminderMessage {
  return {
    title: '逆復唱トレーニング',
    body: '今日のトレーニングをまだ済ませていません。1セットだけでも挑戦しましょう！',
  }
}
