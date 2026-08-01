import { useCallback, useEffect, useRef } from 'react'
import { loadSettings } from '../lib/settings'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

const SPEECH_TIMEOUT_BASE_MS = 4000
const SPEECH_TIMEOUT_PER_CHAR_MS = 700

export function useSpeechSynthesis() {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (!supported) return

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      const { voiceURI } = loadSettings()
      const preferred = voiceURI
        ? voices.find((v) => v.voiceURI === voiceURI)
        : undefined
      voiceRef.current =
        preferred ??
        voices.find((v) => v.lang === 'ja-JP') ??
        voices.find((v) => v.lang.startsWith('ja')) ??
        null
    }

    pickVoice()
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice)
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', pickVoice)
  }, [])

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (!supported) {
        resolve()
        return
      }
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ja-JP'
      utterance.rate = loadSettings().speechRate
      if (voiceRef.current) utterance.voice = voiceRef.current

      let settled = false
      // タブが非アクティブになるとonend/onerrorが発火しないブラウザがあるため、
      // 発火しなかった場合に備えてフォールバックのタイムアウトを設ける
      const timeoutMs = SPEECH_TIMEOUT_BASE_MS + text.length * SPEECH_TIMEOUT_PER_CHAR_MS
      const timeoutId = window.setTimeout(() => {
        if (settled) return
        settled = true
        resolve()
      }, timeoutMs)
      const settle = () => {
        if (settled) return
        settled = true
        window.clearTimeout(timeoutId)
        resolve()
      }
      utterance.onend = settle
      utterance.onerror = settle
      window.speechSynthesis.speak(utterance)
    })
  }, [])

  return { supported, speak }
}
