// プッシュ通知リマインダーの送信判定・メッセージ生成ロジック。
// api/_lib/reminder.ts に複製を保持している（Vercel Functionsのビルドを
// src/ 側のtsconfig/DOM libから独立させるため）。片方を変更したらもう一方も
// 更新すること。

const JST_OFFSET_MS = 9 * 60 * 60 * 1000

function toJstDate(date: Date): Date {
  return new Date(date.getTime() + JST_OFFSET_MS)
}

// UTCの日時をJSTの日付キー（YYYY-MM-DD）に変換する
export function getJstDateKey(date: Date): string {
  const jst = toJstDate(date)
  const y = jst.getUTCFullYear()
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0')
  const d = String(jst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// UTCの日時をJSTの時（0〜23）に変換する
export interface ReminderCheckInput {
  // 'YYYY-MM-DD'（JST）。まだ一度も同期していなければnull
  lastPracticedDateKey: string | null
  // 直近でリマインドを送った日（JST）。二重送信防止用。まだ未送信ならnull
  lastReminderSentDateKey: string | null
  // 判定基準時刻（UTC）。Cronの実行時刻を渡す
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

export function buildReminderMessage(): ReminderMessage {
  return {
    title: '逆復唱トレーニング',
    body: '今日のトレーニングをまだ済ませていません。1セットだけでも挑戦しましょう！',
  }
}
