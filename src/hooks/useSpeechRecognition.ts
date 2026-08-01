import { useCallback, useEffect, useRef, useState } from 'react'

const RecognitionCtor =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
    : undefined

const MAX_ALTERNATIVES = 5

export interface ListenResult {
  transcript: string
  alternatives: string[]
  timedOut: boolean
  error: SpeechRecognitionErrorCode | null
}

export function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const listenOnce = useCallback((timeoutMs = 8000) => {
    return new Promise<ListenResult>((resolve) => {
      if (!RecognitionCtor) {
        resolve({ transcript: '', alternatives: [], timedOut: false, error: null })
        return
      }

      // 前回の認識がまだ動いていた場合、start() が InvalidStateError を
      // 投げてこの Promise が reject され、呼び出し側が待ち続けてしまうのを防ぐ
      recognitionRef.current?.abort()

      const recognition = new RecognitionCtor()
      recognitionRef.current = recognition
      recognition.lang = 'ja-JP'
      recognition.interimResults = false
      recognition.maxAlternatives = MAX_ALTERNATIVES

      let settled = false
      const timer = setTimeout(() => {
        try {
          recognition.stop()
        } catch {
          /* already stopped */
        }
      }, timeoutMs)

      const finish = (
        transcript: string,
        alternatives: string[],
        timedOut: boolean,
        error: SpeechRecognitionErrorCode | null,
      ) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        setListening(false)
        resolve({ transcript, alternatives, timedOut, error })
      }

      recognition.onresult = (event) => {
        const result = event.results[0]
        const alternatives: string[] = []
        for (let i = 0; i < result.length; i++) {
          alternatives.push(result[i].transcript)
        }
        finish(alternatives[0] ?? '', alternatives, false, null)
      }
      recognition.onerror = (event) => finish('', [], false, event.error)
      recognition.onend = () => finish('', [], true, null)
      recognition.onstart = () => setListening(true)

      try {
        recognition.start()
      } catch {
        finish('', [], false, 'aborted')
      }
    })
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { supported: Boolean(RecognitionCtor), listening, listenOnce, stop }
}
