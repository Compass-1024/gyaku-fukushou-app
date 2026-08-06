// プッシュ通知リマインダーの送信判定・メッセージ生成ロジック。
// api/_lib/reminder.ts に複製を保持している（Vercel Functionsのビルドを
// src/ 側のtsconfig/DOM libから独立させるため）。片方を変更したらもう一方も
// 更新すること。
import type { Language } from '../types'

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

export interface ReminderCheckInput {
  lastPracticedDateKey: string | null
  lastReminderSentDateKey: string | null
  nowUtc: Date
}

// Vercel Cronは1日1回のみ・実行時刻は指定時刻から最大59分ずれ得るため、
// 時刻の一致は見ずに「今日まだプレイしていない」かつ「今日まだ送信していない」
// 場合にのみ送信する（Cronが1日1回しか呼ばれない前提で、これで二重送信も防げる）
export function shouldSendReminder(input: ReminderCheckInput): boolean {
  const todayKey = getJstDateKey(input.nowUtc)
  if (input.lastPracticedDateKey === todayKey) return false
  if (input.lastReminderSentDateKey === todayKey) return false
  return true
}

export interface ReminderMessage {
  title: string
  body: string
}

const REMINDER_MESSAGES: Record<Language, ReminderMessage> = {
  ja: {
    title: '逆復唱トレーニング',
    body: '今日のトレーニングをまだ済ませていません。1セットだけでも挑戦しましょう！',
  },
  en: {
    title: 'Working Memory Training',
    body: "You haven't trained today yet. Try just one set!",
  },
}

export function buildReminderMessage(language: Language = 'ja'): ReminderMessage {
  return REMINDER_MESSAGES[language] ?? REMINDER_MESSAGES.ja
}
