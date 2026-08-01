import { getJstDateKey } from './reminder'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

// iOSはホーム画面に追加済み（standalone表示）でないとWeb Pushに対応していない
function isIosStandaloneOk(): boolean {
  if (!isIos()) return true
  return window.matchMedia('(display-mode: standalone)').matches
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (!VAPID_PUBLIC_KEY) return false
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    isIosStandaloneOk()
  )
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64Safe)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i)
  }
  return bytes
}

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'permission-denied' | 'error' }

export async function subscribeToPush(): Promise<SubscribeResult> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { ok: false, reason: 'permission-denied' }
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string),
    })

    const response = await postJson('/api/push/subscribe', {
      subscription: subscription.toJSON(),
    })
    if (!response.ok) {
      console.error(
        '[push] failed to register subscription with server',
        response.status,
      )
      return { ok: false, reason: 'error' }
    }
    return { ok: true }
  } catch (error) {
    // 原因調査用。ここで握りつぶすと利用者側で失敗理由が全く分からなくなるため
    console.error('[push] subscribeToPush failed', error)
    return { ok: false, reason: 'error' }
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return

    await postJson('/api/push/unsubscribe', { endpoint: subscription.endpoint })
    await subscription.unsubscribe()
  } catch {
    /* ベストエフォート。失敗してもUIをブロックしない */
  }
}

// 1セット完了直後に呼ぶ想定なので、常に「今日プレイした」として同期する。
// 購読中の場合のみサーバーへ送信し、未購読・非対応環境・通信失敗はすべて
// 無視する（ベストエフォート、UIをブロックしない）
export async function syncPushState(): Promise<void> {
  try {
    if (!isPushSupported()) return
    if (!('serviceWorker' in navigator)) return
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return

    await postJson('/api/push/sync', {
      endpoint: subscription.endpoint,
      lastPracticedDateKey: getJstDateKey(new Date()),
    })
  } catch {
    /* ベストエフォート */
  }
}
