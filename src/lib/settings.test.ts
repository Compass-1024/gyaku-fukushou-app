import { describe, expect, it, beforeEach } from 'vitest'
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './settings'

function createMemoryStorage(): Storage {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length
    },
  }
}

beforeEach(() => {
  globalThis.localStorage = createMemoryStorage()
})

describe('loadSettings', () => {
  it('データが無ければDEFAULT_SETTINGSを返す', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('壊れたJSONならDEFAULT_SETTINGSにフォールバックする', () => {
    localStorage.setItem('gyaku-fukushou:settings', '{invalid')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('保存値がオブジェクトでない（配列やプリミティブ）場合もDEFAULT_SETTINGSにフォールバックする', () => {
    localStorage.setItem('gyaku-fukushou:settings', '42')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem('gyaku-fukushou:settings', '[]')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem('gyaku-fukushou:settings', 'null')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('保存されている値の欠けたフィールドはDEFAULT_SETTINGSで補う', () => {
    localStorage.setItem(
      'gyaku-fukushou:settings',
      JSON.stringify({ soundEnabled: false }),
    )
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, soundEnabled: false })
  })

  it('localStorage.getItemが例外を投げてもDEFAULT_SETTINGSにフォールバックする', () => {
    globalThis.localStorage = {
      ...createMemoryStorage(),
      getItem: () => {
        throw new Error('storage unavailable')
      },
    }
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('saveSettings / loadSettings roundtrip', () => {
  it('保存した内容をそのまま読み込める', () => {
    const settings = { ...DEFAULT_SETTINGS, themeMode: 'dark' as const, dailyGoal: 10 }
    saveSettings(settings)
    expect(loadSettings()).toEqual(settings)
  })

  it('localStorage.setItemが例外を投げても無視する（クラッシュしない）', () => {
    globalThis.localStorage = {
      ...createMemoryStorage(),
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow()
  })
})
