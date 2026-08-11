/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

interface PushPayload {
  title?: string
  body?: string
}

self.addEventListener('push', (event) => {
  let data: PushPayload = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    /* ペイロードがJSONでない場合は既定文言にフォールバック */
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'おぼえトレ', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      // Android通知シェードのバッジはOSが単色にティントするため、
      // フルカラーアイコンではなく透過シルエット画像(badge-96.png)を使う
      badge: '/badge-96.png',
      tag: 'daily-reminder',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      const existing = clientList.find((c) => 'focus' in c)
      if (existing) return existing.focus()
      return self.clients.openWindow('/')
    }),
  )
})
