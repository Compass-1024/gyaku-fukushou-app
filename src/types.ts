export type Level = 1 | 2 | 3

// 各モードのゲーム画面コンポーネントに共通するprops。
// モード固有の追加props（例: DigitGameScreenのgameType）は
// `& { ... }`で拡張する
export interface BaseGameScreenProps {
  level: Level
  onExit: () => void
  onSelectLevel: (level: Level) => void
}

export type Mode = 'word' | 'digit' | 'nback' | 'spatial' | 'pattern' | 'tone'
export type DigitGameType = 'reverse' | 'sum'
export type ThemeMode = 'system' | 'light' | 'dark'
export type Language = 'ja' | 'en'

export interface Phrase {
  id: string
  text: string
}

export type QuestionPhase = 'reading' | 'repeat' | 'listening' | 'result'

export interface QuestionResult {
  phrase: Phrase
  expectedAnswer: string
  heard: string
  correct: boolean
  micError: SpeechRecognitionErrorCode | null
}

export interface DigitQuestion {
  id: string
  digits: number[]
}

export type DigitQuestionPhase = 'ready' | 'showing' | 'answering' | 'result'

export interface DigitQuestionResult {
  question: DigitQuestion
  expectedAnswer: string
  typed: string
  correct: boolean
}

export interface HistoryEntry {
  mode: Mode
  gameType?: DigitGameType
  level: Level
  correct: number
  total: number
  timestamp: string
}

export interface AppSettings {
  themeMode: ThemeMode
  language: Language
  speechRate: number
  voiceURI: string | null
  soundEnabled: boolean
  dailyGoal: number
  notificationsEnabled: boolean
}

export interface NBackTrial {
  digit: number
  isMatch: boolean
}

export type NBackPhase = 'ready' | 'showing' | 'result'

export interface SpatialQuestion {
  id: string
  gridSize: number
  sequence: number[]
}

export type SpatialQuestionPhase = 'ready' | 'showing' | 'answering' | 'result'

export interface SpatialQuestionResult {
  question: SpatialQuestion
  expectedAnswer: number[]
  tapped: number[]
  correct: boolean
}

export interface PatternQuestion {
  id: string
  gridSize: number
  filledCells: number[]
  comparisonCells: number[]
  hasChange: boolean
}

export type PatternQuestionPhase = 'ready' | 'showing' | 'answering' | 'result'

export interface PatternQuestionResult {
  question: PatternQuestion
  answeredChanged: boolean
  correct: boolean
}

export interface ToneQuestion {
  id: string
  sequence: number[]
}

export type ToneQuestionPhase = 'ready' | 'showing' | 'answering' | 'result'

export interface ToneQuestionResult {
  question: ToneQuestion
  tapped: number[]
  correct: boolean
}
