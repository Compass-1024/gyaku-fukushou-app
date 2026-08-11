import type { Translations } from './i18n'
import type { Mode } from '../types'

// ホームの3×3グリッド用の選択キー。すうじモードは「逆から入力」「合計を入力」を
// 独立したカードとして扱うため、Mode型の'digit'ではなくこの拡張キーを使う
export type TopModeSelection = Exclude<Mode, 'digit'> | 'digit-reverse' | 'digit-sum'

export interface ModeCardConfig {
  mode: TopModeSelection
  icon: string
  gradient: string
  title: string
  description: string
}

// fix③-6: TopScreen.tsxの肥大化対策で、モードカードのメタデータ定義（見た目に
// 関する固定情報）だけを分離した。言語別のフィルタ（ことばモードは英語版で
// 対象外）は呼び出し側(TopScreen)が担う
export function getModeCards(t: Translations): ModeCardConfig[] {
  return [
    {
      mode: 'word',
      icon: '🗣️',
      gradient: 'from-emerald-500 to-teal-500',
      title: t.top.modes.word.title,
      description: t.top.modes.word.description,
    },
    {
      mode: 'digit-reverse',
      icon: '🔢',
      gradient: 'from-indigo-500 to-fuchsia-500',
      title: t.top.modes.digitReverse.title,
      description: t.top.modes.digitReverse.description,
    },
    {
      mode: 'digit-sum',
      icon: '➕',
      gradient: 'from-teal-500 to-sky-500',
      title: t.top.modes.digitSum.title,
      description: t.top.modes.digitSum.description,
    },
    {
      mode: 'nback',
      icon: '🧠',
      gradient: 'from-rose-500 to-orange-500',
      title: t.top.modes.nback.title,
      description: t.top.modes.nback.description,
    },
    {
      mode: 'dual-nback',
      icon: '🧠🧠',
      gradient: 'from-purple-500 to-rose-500',
      title: t.top.modes.dualNback.title,
      description: t.top.modes.dualNback.description,
    },
    {
      mode: 'spatial',
      icon: '🧩',
      gradient: 'from-cyan-500 to-blue-500',
      title: t.top.modes.spatial.title,
      description: t.top.modes.spatial.description,
    },
    {
      mode: 'pattern',
      icon: '👀',
      gradient: 'from-amber-500 to-yellow-500',
      title: t.top.modes.pattern.title,
      description: t.top.modes.pattern.description,
    },
    {
      mode: 'tone',
      icon: '🎵',
      gradient: 'from-violet-500 to-pink-500',
      title: t.top.modes.tone.title,
      description: t.top.modes.tone.description,
    },
    {
      mode: 'random',
      icon: '🎲',
      gradient: 'from-fuchsia-500 to-orange-400',
      title: t.top.modes.random.title,
      description: t.top.modes.random.description,
    },
    {
      mode: 'ops-span',
      icon: '🧮',
      gradient: 'from-lime-500 to-emerald-500',
      title: t.top.modes.opsSpan.title,
      description: t.top.modes.opsSpan.description,
    },
  ]
}
