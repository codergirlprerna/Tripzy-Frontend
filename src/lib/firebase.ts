import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// persistentLocalCache turns on Firestore's built-in offline support: reads come
// from a local IndexedDB cache when offline, and writes (chat messages, poll votes,
// expense entries, location tags) queue automatically and sync once back online.
// This covers every Firestore *document* write for free — it does NOT cover Storage
// file uploads (photos, voice notes), which have no offline queueing built in and
// need the separate custom queue in lib/offlineQueue.ts.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
})

export const storage = getStorage(app)