import { describe, expect, it } from 'vitest'
import { resolveIsDark } from './theme'

describe('resolveIsDark', () => {
  it('is always dark when mode is "dark"', () => {
    expect(resolveIsDark('dark', false)).toBe(true)
    expect(resolveIsDark('dark', true)).toBe(true)
  })

  it('is always light when mode is "light"', () => {
    expect(resolveIsDark('light', false)).toBe(false)
    expect(resolveIsDark('light', true)).toBe(false)
  })

  it('follows the system preference when mode is "system"', () => {
    expect(resolveIsDark('system', true)).toBe(true)
    expect(resolveIsDark('system', false)).toBe(false)
  })
})
