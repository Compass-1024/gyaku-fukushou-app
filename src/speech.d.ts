// lib.dom.d.tsにはSpeechRecognitionEvent/ErrorEventの型はあるが、
// SpeechRecognitionコンストラクタ自体は含まれない（Chromeでは今も
// ベンダープレフィックス付きのため）
interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: ((event: Event) => void) | null
  onstart: ((event: Event) => void) | null
  onspeechend: ((event: Event) => void) | null
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition
  webkitSpeechRecognition?: new () => SpeechRecognition
  webkitAudioContext?: typeof AudioContext
}
