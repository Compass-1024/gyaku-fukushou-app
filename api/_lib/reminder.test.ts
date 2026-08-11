// src/lib/reminder.test.ts で網羅的にテスト済みのロジックのサーバー側複製。
// ここでは複製が正しく同期されているかを確認する軽量なスモークテストのみ行う。
import { describe, expect, it } from 'vitest'
import { getJstDateKey, shouldSendReminder, buildReminderMessage } from './reminder.js'

describe('api/_lib/reminder (src/lib/reminder.ts との同期確認)', () => {
  it('getJstDateKey converts UTC to JST correctly', () => {
    expect(getJstDateKey(new Date('2026-08-01T15:30:00Z'))).toBe('2026-08-02')
  })

  it('shouldSendReminder respects the today-already-done checks', () => {
    const nowUtc = new Date('2026-08-01T12:00:00Z') // 21時ごろ JST
    expect(
      shouldSendReminder({
        lastPracticedDateKey: null,
        lastReminderSentDateKey: null,
        nowUtc,
      }),
    ).toBe(true)
    expect(
      shouldSendReminder({
        lastPracticedDateKey: '2026-08-01',
        lastReminderSentDateKey: null,
        nowUtc,
      }),
    ).toBe(false)
  })

  it('buildReminderMessage returns a non-empty message', () => {
    const message = buildReminderMessage()
    expect(message.title.length).toBeGreaterThan(0)
    expect(message.body.length).toBeGreaterThan(0)
  })

  it('buildReminderMessage supports the "en" language', () => {
    const message = buildReminderMessage('en')
    expect(message.title).toBe('Oboe-Tore')
  })
})
