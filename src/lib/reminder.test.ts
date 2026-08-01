import { describe, expect, it } from 'vitest'
import { getJstDateKey, shouldSendReminder, buildReminderMessage } from './reminder'

describe('getJstDateKey', () => {
  it('converts a UTC time within the same JST day', () => {
    // 2026-08-01T10:00:00Z + 9h = 2026-08-01T19:00:00 JST
    expect(getJstDateKey(new Date('2026-08-01T10:00:00Z'))).toBe('2026-08-01')
  })

  it('rolls over to the next JST day for late-UTC times', () => {
    // 2026-08-01T15:30:00Z + 9h = 2026-08-02T00:30:00 JST
    expect(getJstDateKey(new Date('2026-08-01T15:30:00Z'))).toBe('2026-08-02')
  })

  it('does not roll over just before the JST day boundary', () => {
    // 2026-08-01T14:59:00Z + 9h = 2026-08-01T23:59:00 JST
    expect(getJstDateKey(new Date('2026-08-01T14:59:00Z'))).toBe('2026-08-01')
  })
})

describe('shouldSendReminder', () => {
  const nowUtc = new Date('2026-08-01T12:00:00Z') // 21時ごろ JST, 2026-08-01

  it('sends when nothing has happened today', () => {
    expect(
      shouldSendReminder({
        lastPracticedDateKey: null,
        lastReminderSentDateKey: null,
        nowUtc,
      }),
    ).toBe(true)
  })

  it('does not send when the user already practiced today (JST)', () => {
    expect(
      shouldSendReminder({
        lastPracticedDateKey: '2026-08-01',
        lastReminderSentDateKey: null,
        nowUtc,
      }),
    ).toBe(false)
  })

  it('does not send when a reminder was already sent today (JST)', () => {
    expect(
      shouldSendReminder({
        lastPracticedDateKey: null,
        lastReminderSentDateKey: '2026-08-01',
        nowUtc,
      }),
    ).toBe(false)
  })

  it('sends again once practiced/sent dates are from a previous day', () => {
    expect(
      shouldSendReminder({
        lastPracticedDateKey: '2026-07-31',
        lastReminderSentDateKey: '2026-07-31',
        nowUtc,
      }),
    ).toBe(true)
  })
})

describe('buildReminderMessage', () => {
  it('returns a non-empty title and body', () => {
    const message = buildReminderMessage()
    expect(message.title.length).toBeGreaterThan(0)
    expect(message.body.length).toBeGreaterThan(0)
  })
})
