// 効果音（sound.ts）とBGM（bgm.ts）で共有するAudioContextのシングルトン。
// 複数のAudioContextを作らないよう1ファイルに集約する。

let ctx: AudioContext | null = null
let unlockAttached = false
let masterBus: DynamicsCompressorNode | null = null

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

// 効果音・BGMが最終的に必ず通る共有バス。スマートフォン内蔵スピーカーは
// PC・据え置きスピーカーより出力が小さく、個々の音源のゲインを単純に
// 上げるだけだと大きな音でクリッピング（音割れ）してしまう。
// DynamicsCompressorで信号を軽く圧縮してから送ることで、クリッピングを
// 防ぎつつ全体の体感音量（ラウドネス）を底上げする
export function getMasterBus(context: AudioContext): DynamicsCompressorNode {
  if (!masterBus) {
    masterBus = context.createDynamicsCompressor()
    masterBus.threshold.value = -20
    masterBus.knee.value = 24
    masterBus.ratio.value = 8
    masterBus.attack.value = 0.003
    masterBus.release.value = 0.25
    masterBus.connect(context.destination)
  }
  return masterBus
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
