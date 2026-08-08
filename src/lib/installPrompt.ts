// ④-5: PWAインストール促進バナー。`beforeinstallprompt`はページ生存中に
// 一度しか発火せず、複数のコンポーネントが個別にlistenすると後勝ちで
// イベントを取りこぼす恐れがあるため、モジュールスコープのシングルトンで
// 一度だけ受け取り、購読者（useInstallPrompt）へ通知する
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredEvent: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredEvent = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredEvent = null
    notify()
  })
}

export function getDeferredInstallEvent(): BeforeInstallPromptEvent | null {
  return deferredEvent
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export type InstallPromptOutcome = 'accepted' | 'dismissed' | 'unavailable'

export async function triggerInstallPrompt(): Promise<InstallPromptOutcome> {
  if (!deferredEvent) return 'unavailable'
  await deferredEvent.prompt()
  const choice = await deferredEvent.userChoice
  deferredEvent = null
  notify()
  return choice.outcome
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

const DISMISS_KEY = 'gyaku-fukushou:installBannerDismissedAt'
// 一度閉じたら一定期間は表示しない（毎回のセット完了ごとに出ると鬱陶しいため）
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000

export function isInstallBannerDismissed(now: Date = new Date()): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const dismissedAtMs = Number(raw)
    if (!Number.isFinite(dismissedAtMs)) return false
    return now.getTime() - dismissedAtMs < DISMISS_COOLDOWN_MS
  } catch {
    return false
  }
}

export function markInstallBannerDismissed(now: Date = new Date()): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(now.getTime()))
  } catch {
    /* localStorage unavailable (private mode, quota, etc.) */
  }
}
