import { loadSettings } from './settings'
import { getSharedAudioContext } from './audioContext'

// 完全プログラム生成のアンビエントBGM（音声ファイルは一切使わない、sound.tsと
// 同じ方針）。4つのコードを緩やかに巡回させ、隣り合うコード同士をクロスフェード
// させることで、集中を妨げない持続的な背景音を作る。

const CHORD_PROGRESSION: readonly (readonly number[])[] = [
  [130.81, 164.81, 196.0], // C3 major
  [110.0, 130.81, 164.81], // A2 minor
  [87.31, 110.0, 130.81], // F2 major
  [98.0, 123.47, 146.83], // G2 major
]

// 1コードの持続時間と、次のコードへ移る際に重ねるクロスフェード時間
const CHORD_DURATION_S = 8
const CROSSFADE_S = 3
// 次に鳴らすコードをどれだけ先読みしてスケジュールしておくか、
// およびスケジューラーを起こす間隔
const SCHEDULE_AHEAD_S = 1
const SCHEDULER_INTERVAL_MS = 250

let masterGain: GainNode | null = null
let playing = false
let nextChordTime = 0
let chordIndex = 0
let schedulerId: ReturnType<typeof setTimeout> | null = null

function getVolumeMultiplier(): number {
  return Math.max(0, Math.min(100, loadSettings().bgmVolume)) / 100
}

function ensureMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = ctx.createGain()
    masterGain.gain.value = getVolumeMultiplier()
    masterGain.connect(ctx.destination)
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
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = ctx.createGain()
    const peak = 0.06
    g.gain.setValueAtTime(0.0001, startTime)
    g.gain.exponentialRampToValueAtTime(peak, startTime + CROSSFADE_S)
    g.gain.setValueAtTime(peak, endTime - CROSSFADE_S)
    g.gain.exponentialRampToValueAtTime(0.0001, endTime)
    osc.connect(g)
    g.connect(bus)
    osc.start(startTime)
    osc.stop(endTime + 0.1)
  })
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
  if (masterGain) masterGain.gain.value = getVolumeMultiplier()
}
