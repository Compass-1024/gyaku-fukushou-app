export type Level = 1 | 2 | 3

export type Mode = 'word' | 'digit' | 'nback'
export type DigitGameType = 'reverse' | 'sum'
export type ThemeMode = 'system' | 'light' | 'dark'

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
  speechRate: number
  voiceURI: string | null
  soundEnabled: boolean
  dailyGoal: number
}

export interface NBackTrial {
  digit: number
  isMatch: boolean
}

export type NBackPhase = 'ready' | 'showing' | 'result'
