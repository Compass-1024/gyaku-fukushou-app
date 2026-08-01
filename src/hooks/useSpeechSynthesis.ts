import { useCallback, useEffect, useRef } from 'react'
import { loadSettings } from '../lib/settings'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

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
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
    })
  }, [])

  return { supported, speak }
}
