import { loadSettings } from './settings'
import { getSharedAudioContext, getMasterBus } from './audioContext'

// 完全プログラム生成のBGM（音声ファイルは一切使わない、sound.tsと同じ方針）。
// I-V-vi-IVの明るいポップ進行を軽快なテンポで巡回させ、パッド（持続音）に加えて
// 各コードの頭で短いプラック（爪弾き）音を鳴らすことで、単調にならない軽やかな
// 印象にしている。隣り合うコード同士はクロスフェードさせ、集中を妨げない
// 持続的な背景音を保つ

const CHORD_PROGRESSION: readonly (readonly number[])[] = [
  [261.63, 329.63, 392.0], // C4 major
  [196.0, 246.94, 293.66], // G3 major
  [220.0, 261.63, 329.63], // A3 minor
  [174.61, 220.0, 261.63], // F3 major
]

// 1コードの持続時間と、次のコードへ移る際に重ねるクロスフェード時間。
// 以前より短くテンポアップし、軽快な印象にしている
const CHORD_DURATION_S = 4
const CROSSFADE_S = 1.2
// 次に鳴らすコードをどれだけ先読みしてスケジュールしておくか、
// およびスケジューラーを起こす間隔
const SCHEDULE_AHEAD_S = 1
const SCHEDULER_INTERVAL_MS = 250
// BGMを一時停止（ダッキング）する際のフェード時間
const DUCK_FADE_S = 0.4

let masterGain: GainNode | null = null
let playing = false
let ducked = false
let nextChordTime = 0
let chordIndex = 0
let schedulerId: ReturnType<typeof setTimeout> | null = null

function getVolumeMultiplier(): number {
  if (ducked) return 0
  return Math.max(0, Math.min(100, loadSettings().bgmVolume)) / 100
}

function ensureMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = ctx.createGain()
    masterGain.gain.value = getVolumeMultiplier()
    masterGain.connect(getMasterBus(ctx))
  }
  return masterGain
}

function scheduleChord(
  ctx: AudioContext,
  bus: GainNode,
  freqs: readonly number[],
  startTime: number,
): void {
  const endTime = startTime + CHORD_DURATION_S
  // 持続するパッド音（和音を支える土台）
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = ctx.createGain()
    const peak = 0.09
    g.gain.setValueAtTime(0.0001, startTime)
    g.gain.exponentialRampToValueAtTime(peak, startTime + CROSSFADE_S)
    g.gain.setValueAtTime(peak, endTime - CROSSFADE_S)
    g.gain.exponentialRampToValueAtTime(0.0001, endTime)
    osc.connect(g)
    g.connect(bus)
    osc.start(startTime)
    osc.stop(endTime + 0.1)
  })

  // コードの頭で鳴らす短いプラック音（1オクターブ上）。軽快さを出すための
  // リズム的なアクセントで、パッドより短い減衰で消える
  const pluckNote = freqs[0] * 2
  const pluckOsc = ctx.createOscillator()
  pluckOsc.type = 'triangle'
  pluckOsc.frequency.value = pluckNote
  const pluckGain = ctx.createGain()
  pluckGain.gain.setValueAtTime(0.0001, startTime)
  pluckGain.gain.exponentialRampToValueAtTime(0.1, startTime + 0.01)
  pluckGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6)
  pluckOsc.connect(pluckGain)
  pluckGain.connect(bus)
  pluckOsc.start(startTime)
  pluckOsc.stop(startTime + 0.65)
}

function schedulerTick(): void {
  if (!playing) return
  const ctx = getSharedAudioContext()
  if (!ctx) return
  const bus = ensureMasterGain(ctx)
  while (nextChordTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
    scheduleChord(ctx, bus, CHORD_PROGRESSION[chordIndex % CHORD_PROGRESSION.length], nextChordTime)
    nextChordTime += CHORD_DURATION_S - CROSSFADE_S
    chordIndex += 1
  }
  schedulerId = setTimeout(schedulerTick, SCHEDULER_INTERVAL_MS)
}

export function startBgm(): void {
  if (playing) return
  const ctx = getSharedAudioContext()
  if (!ctx) return
  playing = true
  chordIndex = 0
  nextChordTime = ctx.currentTime + 0.1
  ensureMasterGain(ctx)
  schedulerTick()
}

export function stopBgm(): void {
  playing = false
  if (schedulerId !== null) {
    clearTimeout(schedulerId)
    schedulerId = null
  }
  if (masterGain) {
    masterGain.disconnect()
    masterGain = null
  }
}

export function isBgmPlaying(): boolean {
  return playing
}

// 音量スライダー操作時に、再生中のBGMへ即座に反映する
export function applyBgmVolume(): void {
  if (masterGain && !ducked) masterGain.gain.value = getVolumeMultiplier()
}

// 問題を解いている間（showing/answering中）はBGMを一時的に無音化する。
// スケジューラー自体は止めずコード進行を裏で続けたまま音量だけ0にすることで、
// 再開時に途切れなく元のテンポへ復帰できる
export function setBgmDucked(nextDucked: boolean): void {
  if (ducked === nextDucked) return
  ducked = nextDucked
  const ctx = getSharedAudioContext()
  if (!masterGain || !ctx) return
  const target = getVolumeMultiplier()
  masterGain.gain.cancelScheduledValues(ctx.currentTime)
  masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime)
  masterGain.gain.linearRampToValueAtTime(target, ctx.currentTime + DUCK_FADE_S)
}
