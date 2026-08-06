import { doc, getDoc, setDoc } from 'firebase/firestore'
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

export async function countOwnedTrips(uid: string): Promise<number> {
  const { collection, query, where, getDocs } = await import('firebase/firestore')
  const q = query(collection(db, 'trips'), where('ownerId', '==', uid))
  const snap = await getDocs(q)
  return snap.size
}