import { getToken, onMessage } from 'firebase/messaging'
import { messagingReady } from '@/lib/firebase'
import { saveFcmToken } from '@/lib/users'

export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

export function getPushPermissionState(): PushPermissionState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

/**
 * Asks the browser for notification permission, then registers this device
 * with FCM and saves the resulting token onto the user's profile so the
 * backend knows where to send pushes for them.
 *
 * Requires VITE_FIREBASE_VAPID_KEY (Firebase console → Project Settings →
 * Cloud Messaging → Web Push certificates → generate one if you don't have
 * it yet). Without it, getToken() throws, so this returns false rather than
 * a half-working state.
 */
export async function enablePushNotifications(uid: string): Promise<boolean> {
  const messaging = await messagingReady
  if (!messaging) return false // unsupported browser/context (see firebase.ts)

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    console.error('VITE_FIREBASE_VAPID_KEY is not set — cannot register for push. See lib/push.ts.')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
    if (!token) return false

    await saveFcmToken(uid, token)
    return true
  } catch (err) {
    console.error('Failed to register for push notifications:', err)
    return false
  }
}

/**
 * Listens for pushes that arrive WHILE a Tripzy tab has focus. FCM delivers
 * these differently from backgrounded pushes — the service worker's
 * onBackgroundMessage (public/firebase-messaging-sw.js) is deliberately
 * skipped in this case, so this is the only place foreground pushes surface.
 * Call once, e.g. from a top-level layout, and show a toast/banner with the
 * payload however fits the app's UI — this just hands you the data.
 */
export async function subscribeToForegroundPush(
  callback: (payload: { title: string; body: string; tripId?: string }) => void,
) {
  const messaging = await messagingReady
  if (!messaging) return () => {}

  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title || 'Tripzy',
      body: payload.notification?.body || '',
      tripId: payload.data?.tripId,
    })
  })
}