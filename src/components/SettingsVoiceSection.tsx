import { useEffect, useState } from 'react'

const RATE_OPTIONS: { value: number; label: string }[] = [
  { value: 0.75, label: 'ゆっくり' },
  { value: 0.95, label: 'ふつう' },
  { value: 1.15, label: 'はやい' },
]

interface SettingsVoiceSectionProps {
  speechRate: number
  voiceURI: string | null
  onChangeRate: (rate: number) => void
  onChangeVoice: (voiceURI: string | null) => void
}

export function SettingsVoiceSection({
  speechRate,
  voiceURI,
  onChangeRate,
  onChangeVoice,
}: SettingsVoiceSectionProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }
    function updateVoices() {
      const all = window.speechSynthesis.getVoices()
      setVoices(all.filter((v) => v.lang.startsWith('ja')))
    }
    updateVoices()
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices)
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
  }, [])

  function handleTestVoice() {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance('こんにちは')
    utterance.lang = 'ja-JP'
    utterance.rate = speechRate
    const voice = voices.find((v) => v.voiceURI === voiceURI)
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          読み上げ速度
        </h2>
        <div className="flex gap-2">
          {RATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChangeRate(opt.value)}
              className={`flex-1 touch-manipulation rounded-lg px-3 py-2 text-sm font-semibold transition ${
                speechRate === opt.value
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {voices.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            声
          </h2>
          <select
            aria-label="声"
            value={voiceURI ?? ''}
            onChange={(e) => onChangeVoice(e.target.value || null)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">自動</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}
              </option>
            ))}
          </select>
        </section>
      )}

      <button
        type="button"
        onClick={handleTestVoice}
        className="touch-manipulation rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        🔊 テスト再生
      </button>
    </>
  )
}
