import type { Level } from '../types'

// 白文字とのコントラスト比がWCAG AA基準（4.5:1以上）を満たす濃さの色を選んでいる
// （500番台は僅かに基準未達だったため、axe-coreの自動検証で判明し700/600番台に変更した）
export const LEVEL_STYLES: Record<Level, string> = {
  1: 'bg-emerald-700 hover:bg-emerald-600 focus-visible:outline-emerald-700',
  2: 'bg-sky-800 hover:bg-sky-700 focus-visible:outline-sky-800',
  3: 'bg-violet-700 hover:bg-violet-600 focus-visible:outline-violet-700',
}
