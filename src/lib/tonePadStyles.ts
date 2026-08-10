// 音・色モードのパッド配色。ToneGameScreen.tsxとRandomToneGrid.tsxで共有する
// （以前はToneGameScreen.tsxにのみ定義されており、ランダムモードの音・色
// ラウンドでは全パッドが同一の色で表示され、モード名の「色」の記憶要素が
// 機能しない不具合があったため、共有ファイルに切り出した）
export const TONE_PAD_COLORS = [
  'bg-rose-500 hover:enabled:bg-rose-400',
  'bg-sky-500 hover:enabled:bg-sky-400',
  'bg-emerald-500 hover:enabled:bg-emerald-400',
  'bg-amber-400 hover:enabled:bg-amber-300',
]

export const TONE_PAD_LIT_COLORS = ['bg-rose-300', 'bg-sky-300', 'bg-emerald-300', 'bg-amber-200']
