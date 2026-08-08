import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'
import { getMessaging, isSupported as isMessagingSupported, Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
// Firebase defaults to this already in a real browser, but setting it
// explicitly rules out the SDK silently falling back to in-memory
// persistence (which forces a re-login on every reload) in edge-case
// environments — some in-app browsers (Instagram/WhatsApp webviews) and
// aggressive privacy modes restrict IndexedDB, which is what local
// persistence relies on.
setPersistence(auth, browserLocalPersistence)
export const googleProvider = new GoogleAuthProvider()

// persistentLocalCache turns on Firestore's built-in offline support: reads come
// from a local IndexedDB cache when offline, and writes (chat messages, poll votes,
// expense entries, location tags) queue automatically and sync once back online.
// File uploads (photos, voice notes) go through Cloudinary instead of Firebase
// Storage — see lib/cloudinary.ts — since Firebase Storage now requires a billing
// card on file (Google policy change, Feb 2026) even to use its free tier.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
})

// Analytics only initializes if the browser supports it AND a measurementId is
// configured — without a linked GA4 property (Firebase console → Project Settings
// → Integrations → Google Analytics), this silently stays null rather than crashing.
export let analytics: ReturnType<typeof getAnalytics> | null = null
isAnalyticsSupported().then((supported) => {
  if (supported && firebaseConfig.measurementId) {
    analytics = getAnalytics(app)
  }
})

// Messaging (push notifications) only works over HTTPS/localhost, in browsers
// that support service workers + the Push API — Safari < 16.4 and any http://
// (non-localhost) origin will fail isMessagingSupported(), so this stays null
// there rather than throwing. See lib/push.ts for how this is actually used.
export let messaging: Messaging | null = null
export const messagingReady: Promise<Messaging | null> = isMessagingSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app)
  }
  return messaging
})