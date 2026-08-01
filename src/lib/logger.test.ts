import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getRecentErrors, logError } from './logger'

describe('logError / getRecentErrors', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('Errorインスタンスからmessageとstackを記録する', () => {
    logError('test-context', new Error('boom'))
    const entries = getRecentErrors()
    expect(entries.at(-1)?.context).toBe('test-context')
    expect(entries.at(-1)?.message).toBe('boom')
    expect(entries.at(-1)?.stack).toBeDefined()
  })

  it('Error以外の値も文字列化して記録する', () => {
    logError('test-context', 'plain string error')
    const entries = getRecentErrors()
    expect(entries.at(-1)?.message).toBe('plain string error')
    expect(entries.at(-1)?.stack).toBeUndefined()
  })

  it('直近20件までしか保持しない', () => {
    for (let i = 0; i < 25; i++) {
      logError('loop', `error-${i}`)
    }
    const entries = getRecentErrors()
    expect(entries).toHaveLength(20)
    expect(entries[0].message).toBe('error-5')
    expect(entries.at(-1)?.message).toBe('error-24')
  })
})
