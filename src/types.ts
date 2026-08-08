export type Level = 1 | 2 | 3

// 各モードのゲーム画面コンポーネントに共通するprops。
// モード固有の追加props（例: DigitGameScreenのgameType）は
// `& { ... }`で拡張する
export interface BaseGameScreenProps {
  level: Level
  onExit: () => void
  onSelectLevel: (level: Level) => void
}

export type Mode =
  | 'word'
  | 'digit'
  | 'nback'
  | 'dual-nback'
  | 'spatial'
  | 'pattern'
  | 'tone'
  | 'random'
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
  sfxVolume: number
  bgmEnabled: boolean
  bgmVolume: number
  dailyGoal: number
  notificationsEnabled: boolean
}

export interface NBackTrial {
  position: number
  isMatch: boolean
}

export type NBackPhase = 'ready' | 'showing' | 'result'

export interface DualNBackTrial {
  position: number
  sound: number
  positionMatch: boolean
  soundMatch: boolean
}

export type DualNBackPhase = 'ready' | 'showing' | 'result'

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
}

export type PatternQuestionPhase = 'ready' | 'showing' | 'answering' | 'result'

export interface PatternQuestionResult {
  question: PatternQuestion
  selectedCells: number[]
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

// ランダムモード: 単発質問→回答型の5ラウンド(すうじ・逆から入力/すうじ・合計を入力/
// 空間/変化検出/音・色)から1問ずつ集めて出題する。各ラウンドは元モードのQuestion型を
// そのまま内包する
export type RandomRound =
  | { mode: 'digit'; gameType: DigitGameType; question: DigitQuestion }
  | { mode: 'spatial'; question: SpatialQuestion }
  | { mode: 'pattern'; question: PatternQuestion }
  | { mode: 'tone'; question: ToneQuestion }

export type RandomQuestionPhase = 'ready' | 'showing' | 'answering' | 'result'
