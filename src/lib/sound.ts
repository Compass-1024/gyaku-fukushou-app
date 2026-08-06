import { loadSettings } from './settings'

let audioContext: AudioContext | null = null
let reverbNode: ConvolverNode | null = null

// 設定画面の効果音音量スライダー(0〜100)を0〜1の係数に変換する
function getVolumeMultiplier(): number {
  return Math.max(0, Math.min(100, loadSettings().sfxVolume)) / 100
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? window.webkitAudioContext
  if (!Ctor) return null
  if (!audioContext) {
    audioContext = new Ctor()
  }
  return audioContext
}

// 短い減衰ノイズからインパルスレスポンスを作り、軽い残響（部屋鳴り）を加える。
// 一度作った ConvolverNode は使い回し、destination への接続も一度だけ行う。
function getReverb(ctx: AudioContext): ConvolverNode {
  if (reverbNode) return reverbNode
  const duration = 1.1
  const length = Math.floor(ctx.sampleRate * duration)
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const data = impulse.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.5
    }
  }
  const convolver = ctx.createConvolver()
  convolver.buffer = impulse
  const outGain = ctx.createGain()
  outGain.gain.value = 0.6
  convolver.connect(outGain)
  outGain.connect(ctx.destination)
  reverbNode = convolver
  return convolver
}

// dry（直接音）と reverb センドをまとめたゲインノードを作る
function createVoiceBus(ctx: AudioContext, reverbSend: number): GainNode {
  const dry = ctx.createGain()
  dry.gain.value = getVolumeMultiplier()
  dry.connect(ctx.destination)
  if (reverbSend > 0) {
    const send = ctx.createGain()
    send.gain.value = reverbSend
    dry.connect(send)
    send.connect(getReverb(ctx))
  }
  return dry
}

interface ToneOptions {
  frequency: number
  startTime: number
  duration: number
  gain: number
  type?: OscillatorType
  harmonics?: number[]
  attack?: number
  detune?: number
}

// 倍音を重ねてベルや弦のような響きを作り、ADSR風のエンベロープをかける
function playHarmonicTone(
  ctx: AudioContext,
  destination: AudioNode,
  opts: ToneOptions,
) {
  const {
    frequency,
    startTime,
    duration,
    gain: peakGain,
    type = 'sine',
    harmonics = [1],
    attack = 0.01,
    detune = 0,
  } = opts
  const endTime = startTime + duration

  harmonics.forEach((amp, i) => {
    if (amp <= 0) return
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = frequency * (i + 1)
    osc.detune.value = detune
    const g = ctx.createGain()
    const peak = Math.max(0.0001, peakGain * amp)
    g.gain.setValueAtTime(0.0001, startTime)
    g.gain.exponentialRampToValueAtTime(peak, startTime + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, endTime)
    osc.connect(g)
    g.connect(destination)
    osc.start(startTime)
    osc.stop(endTime + 0.05)
  })
}

interface NoiseBurstOptions {
  startTime: number
  duration: number
  gain: number
  filterFreq: number
  filterType?: BiquadFilterType
}

// フィルタ付きのノイズバースト。クリック感や打撃音のアタックに使う
function playNoiseBurst(
  ctx: AudioContext,
  destination: AudioNode,
  opts: NoiseBurstOptions,
) {
  const { startTime, duration, gain: peakGain, filterFreq, filterType = 'bandpass' } = opts
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.value = filterFreq
  const g = ctx.createGain()
  g.gain.setValueAtTime(Math.max(0.0001, peakGain), startTime)
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  source.connect(filter)
  filter.connect(g)
  g.connect(destination)
  source.start(startTime)
  source.stop(startTime + duration)
}

// 正解: 明るいベル風の三和音を軽くアルペジオさせる
export function playCorrectSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const bus = createVoiceBus(ctx, 0.25)
  const now = ctx.currentTime
  const notes = [1046.5, 1318.5, 1568.0] // C6, E6, G6
  notes.forEach((freq, i) => {
    playHarmonicTone(ctx, bus, {
      frequency: freq,
      startTime: now + i * 0.07,
      duration: 0.5,
      gain: 0.22,
      type: 'sine',
      harmonics: [1, 0.5, 0.25, 0.12],
      attack: 0.008,
    })
  })
}

// 不正解: 低めの二音下降にノイズのアタックを添えて、ブザーらしい鳴りにする
export function playIncorrectSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const bus = createVoiceBus(ctx, 0)
  const now = ctx.currentTime
  playHarmonicTone(ctx, bus, {
    frequency: 196, // G3
    startTime: now,
    duration: 0.28,
    gain: 0.26,
    type: 'triangle',
    harmonics: [1, 0.6, 0.3],
    attack: 0.005,
  })
  playHarmonicTone(ctx, bus, {
    frequency: 146.83, // D3
    startTime: now + 0.14,
    duration: 0.32,
    gain: 0.26,
    type: 'triangle',
    harmonics: [1, 0.6, 0.3],
    attack: 0.005,
  })
  playNoiseBurst(ctx, bus, {
    startTime: now,
    duration: 0.05,
    gain: 0.15,
    filterFreq: 800,
    filterType: 'lowpass',
  })
}

// ボタン操作の軽いタップ音
export function playButtonTap(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const bus = createVoiceBus(ctx, 0)
  playNoiseBurst(ctx, bus, {
    startTime: ctx.currentTime,
    duration: 0.03,
    gain: 0.1,
    filterFreq: 3000,
    filterType: 'bandpass',
  })
}

// レベルアップ: 華やかな4音アルペジオ
export function playLevelUp(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const bus = createVoiceBus(ctx, 0.35)
  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    playHarmonicTone(ctx, bus, {
      frequency: freq,
      startTime: now + i * 0.09,
      duration: 0.4,
      gain: 0.2,
      type: 'triangle',
      harmonics: [1, 0.5, 0.3, 0.15],
      attack: 0.006,
    })
  })
}

// 音・色モードの4つのパッドに割り当てる音高（ペンタトニック寄りで濁りにくい組み合わせ）
const PAD_FREQUENCIES = [392.0, 440.0, 523.25, 659.25] // G4, A4, C5, E5

// 音・色モード: パッドごとに異なる高さのベル風の単音を鳴らす
export function playPadTone(padIndex: number): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const bus = createVoiceBus(ctx, 0.25)
  const frequency = PAD_FREQUENCIES[padIndex] ?? PAD_FREQUENCIES[0]
  playHarmonicTone(ctx, bus, {
    frequency,
    startTime: ctx.currentTime,
    duration: 0.35,
    gain: 0.22,
    type: 'sine',
    harmonics: [1, 0.5, 0.25, 0.12],
    attack: 0.008,
  })
}

// Dual N-Backモードの8種類の音に割り当てる音高（1オクターブをペンタトニック寄りに
// 8分割し、隣り合う音同士も聞き分けやすいようにしている）
const DUAL_NBACK_FREQUENCIES = [
  261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25,
] // C4〜C5

// Dual N-Backモード: 音番号ごとに異なる高さのベル風の単音を鳴らす
export function playDualNBackTone(soundIndex: number): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const bus = createVoiceBus(ctx, 0.25)
  const frequency = DUAL_NBACK_FREQUENCIES[soundIndex] ?? DUAL_NBACK_FREQUENCIES[0]
  playHarmonicTone(ctx, bus, {
    frequency,
    startTime: ctx.currentTime,
    duration: 0.35,
    gain: 0.22,
    type: 'sine',
    harmonics: [1, 0.5, 0.25, 0.12],
    attack: 0.008,
  })
}

// 実績解除: きらびやかな和音+高音のアクセント
export function playAchievementUnlock(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const bus = createVoiceBus(ctx, 0.4)
  const now = ctx.currentTime
  const chord = [783.99, 987.77, 1174.66] // G5 B5 D6
  chord.forEach((freq) => {
    playHarmonicTone(ctx, bus, {
      frequency: freq,
      startTime: now,
      duration: 0.9,
      gain: 0.16,
      type: 'sine',
      harmonics: [1, 0.6, 0.4, 0.25, 0.15],
      attack: 0.01,
    })
  })
  ;[1567.98, 2093.0].forEach((freq, i) => {
    playHarmonicTone(ctx, bus, {
      frequency: freq,
      startTime: now + 0.15 + i * 0.08,
      duration: 0.35,
      gain: 0.1,
      type: 'sine',
      harmonics: [1, 0.3],
      attack: 0.005,
    })
  })
}
