import { pickDigitQuestionSet } from './digits'
import { pickSpatialQuestionSet } from './spatial'
import { pickPatternQuestionSet } from './pattern'
import { pickToneQuestionSet } from './tone'
import { getLevelStats } from './history'
import type { DigitGameType, HistoryEntry, Level, Mode, RandomRound } from '../types'

export const RANDOM_ROUNDS_PER_SET = 5

const ALL_LEVELS: readonly Level[] = [1, 2, 3]

// 弱点重視モード用: そのモード（+すうじの場合はgameType）の中で、挑戦履歴が
// ある中から最も正答率が低いレベルを選ぶ。挑戦履歴が無ければ選択レベルのまま
// にする（実装は`getWeakestAreas`と同じ「正答率が低いほど優先」の考え方だが、
// 対象をこのモード単体のレベル間比較に絞っている）
function pickFocusedLevel(
  history: HistoryEntry[],
  mode: Mode,
  gameType: DigitGameType | undefined,
  fallback: Level,
): Level {
  let worst: { level: Level; accuracy: number } | null = null
  for (const level of ALL_LEVELS) {
    const stats = getLevelStats(history, level, mode, gameType)
    if (stats.accuracy === null) continue
    if (worst === null || stats.accuracy < worst.accuracy) {
      worst = { level, accuracy: stats.accuracy }
    }
  }
  return worst?.level ?? fallback
}

export interface BuildRandomRoundsOptions {
  // ④-2: 各ラウンドのレベルを、選択レベル固定ではなくモードごとの弱点レベルに
  // 差し替える「弱点重視」オプション。認知トレーニング研究でのインターリーブ
  // 練習（複数課題を織り交ぜる方が定着しやすいという知見）を踏まえ、限られた
  // 練習時間をより弱い分野に配分する
  history: HistoryEntry[]
}

// すうじ（逆から入力/合計を入力）・空間・変化検出・音/色の「単発質問→回答」型
// 5ラウンドから1問ずつ集め、シャッフルした順で5ラウンドのミックス練習を組み立てる。
// Nバック系（連続試行）とことばモード（音声入出力）は構造が大きく異なるため対象外
export function buildRandomRounds(
  level: Level,
  options?: BuildRandomRoundsOptions,
): RandomRound[] {
  const levelFor = (mode: Mode, gameType?: DigitGameType): Level =>
    options ? pickFocusedLevel(options.history, mode, gameType, level) : level

  const rounds: RandomRound[] = [
    {
      mode: 'digit',
      gameType: 'reverse',
      question: pickDigitQuestionSet(levelFor('digit', 'reverse'))[0],
    },
    {
      mode: 'digit',
      gameType: 'sum',
      question: pickDigitQuestionSet(levelFor('digit', 'sum'))[0],
    },
    { mode: 'spatial', question: pickSpatialQuestionSet(levelFor('spatial'))[0] },
    { mode: 'pattern', question: pickPatternQuestionSet(levelFor('pattern'))[0] },
    { mode: 'tone', question: pickToneQuestionSet(levelFor('tone'))[0] },
  ]
  for (let i = rounds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rounds[i], rounds[j]] = [rounds[j], rounds[i]]
  }
  return rounds
}
