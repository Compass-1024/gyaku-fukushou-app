// 効果音（sound.ts）とBGM（bgm.ts）で共有するAudioContextのシングルトン。
// 複数のAudioContextを作らないよう1ファイルに集約する。

let ctx: AudioContext | null = null
let unlockAttached = false

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? window.webkitAudioContext
  if (!Ctor) return null
  if (!ctx) {
    ctx = new Ctor()
    attachAutoplayUnlock(ctx)
  }
  return ctx
}

// Chrome等の一部ブラウザは、ユーザー操作を伴わずに生成されたAudioContextを
// suspended状態のまま開始する。BGMはアプリ起動直後（＝ユーザー操作前）に
// 再生を試みるため、最初のポインタ操作/キー操作で明示的にresume()する
function attachAutoplayUnlock(context: AudioContext): void {
  if (unlockAttached) return
  unlockAttached = true
  function resume() {
    if (context.state === 'suspended') {
      context.resume().catch(() => {
        /* ユーザー操作なしでの自動再生がブロックされている環境では何もしない */
      })
    }
  }
  window.addEventListener('pointerdown', resume, { once: true })
  window.addEventListener('keydown', resume, { once: true })
}
