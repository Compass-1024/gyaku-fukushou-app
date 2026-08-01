import { describe, expect, it, beforeEach } from 'vitest'
import { urlBase64ToUint8Array } from './push'

beforeEach(() => {
  // window.atobを使う実装のため、テスト環境(Node)ではNode組み込みの
  // グローバルatobを流用してwindowを最小限に用意する
  ;(globalThis as unknown as { window: { atob: typeof atob } }).window = {
    atob: globalThis.atob,
  }
})

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url string with no padding needed (length % 4 === 0)', () => {
    // 'hello' の文字コード [104, 101, 108, 108, 111] のbase64は "aGVsbG8="
    const bytes = urlBase64ToUint8Array('aGVsbG8')
    expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111])
  })

  it('adds the correct padding for base64 strings of various lengths', () => {
    // 'hi' -> base64 "aGk=" (2文字のパディングが必要)
    expect(Array.from(urlBase64ToUint8Array('aGk'))).toEqual([104, 105])
    // 'hey' -> base64 "aGV5" (パディング不要)
    expect(Array.from(urlBase64ToUint8Array('aGV5'))).toEqual([104, 101, 121])
  })

  it('converts the URL-safe characters "-" and "_" back to "+" and "/"', () => {
    // バイト列[0xfb, 0xff, 0xbf, 0x00]の標準base64は"+/+/AA=="、
    // base64url(パディング除去)は"-_-_AA"
    const bytes = urlBase64ToUint8Array('-_-_AA')
    expect(Array.from(bytes)).toEqual([0xfb, 0xff, 0xbf, 0x00])
  })

  it('returns an empty array for an empty string', () => {
    expect(Array.from(urlBase64ToUint8Array(''))).toEqual([])
  })
})
