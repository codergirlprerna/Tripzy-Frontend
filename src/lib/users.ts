import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type Plan = 'free' | 'crew' | 'crew_annual'

export const PLAN_LIMITS: Record<Plan, { maxOwnedTrips: number; maxTravelersPerTrip: number }> = {
  free: { maxOwnedTrips: 3, maxTravelersPerTrip: 2 },
  crew: { maxOwnedTrips: Infinity, maxTravelersPerTrip: 8 },
  crew_annual: { maxOwnedTrips: Infinity, maxTravelersPerTrip: 8 },
}

/**
 * Creates a user profile document on first login if one doesn't exist yet.
 * Everyone starts on the free plan — there's no real billing wired up,
 * so upgrading currently only means someone with database access changing
 * this field by hand. A real Upgrade button needs Stripe (or similar)
 * behind it before this becomes self-serve.
 */
export async function ensureUserProfile(uid: string, email: string | null) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { email, plan: 'free' as Plan, createdAt: Date.now() })
  }
}

export async function getUserPlan(uid: string): Promise<Plan> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return 'free'
  return (snap.data().plan as Plan) || 'free'
}

/**
 * Adds a device's FCM token to the user's profile. A user can have several
 * (phone browser, laptop browser, etc.), so this is an array, not a single
 * field — the backend fans a push out to every token on file and drops any
 * that come back invalid (uninstalled app, revoked permission, expired token).
 */
export async function saveFcmToken(uid: string, token: string) {
  await setDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) }, { merge: true })
}

export async function removeFcmToken(uid: string, token: string) {
  await setDoc(doc(db, 'users', uid), { fcmTokens: arrayRemove(token) }, { merge: true })
}

export async function countOwnedTrips(uid: string): Promise<number> {
  // Filtering only by ownerId conflicts with the Firestore rule (which checks
  // memberIds) — Firestore rejects the whole query outright when a list query's
  // filter doesn't structurally match what the rule checks. Reusing the same
  // memberIds filter that's already permitted and indexed elsewhere, then
  // narrowing to owned trips client-side, sidesteps that entirely.
  const { collection, query, where, getDocs } = await import('firebase/firestore')
  const q = query(collection(db, 'trips'), where('memberIds', 'array-contains', uid))
  const snap = await getDocs(q)
  return snap.docs.filter((d) => d.data().ownerId === uid).length
}