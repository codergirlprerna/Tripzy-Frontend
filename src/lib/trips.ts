import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { NewTrip, Trip } from '@/types/trip'

const TRIPS_COLLECTION = 'trips'

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 10)
}

export async function createTrip(trip: NewTrip, ownerName: string) {
  const inviteCode = generateInviteCode()
  const now = Date.now()

  await addDoc(collection(db, TRIPS_COLLECTION), {
    ...trip,
    createdAt: now,
    memberIds: [trip.ownerId],
    members: {
      [trip.ownerId]: { role: 'owner', joinedAt: now, name: ownerName },
    },
    inviteCode,
  })
}

/**
 * Subscribes to every trip a user belongs to — as owner OR as an invited member.
 * Uses `memberIds` (an array every member's uid is added to) rather than `ownerId`,
 * so invited collaborators see the trip on their own dashboard too.
 */
export function subscribeToUserTrips(userId: string, callback: (trips: Trip[]) => void) {
  const tripsQuery = query(
    collection(db, TRIPS_COLLECTION),
    where('memberIds', 'array-contains', userId),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(tripsQuery, (snapshot) => {
    const trips = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Trip[]
    callback(trips)
  })
}

/**
 * Joins a trip via its invite code. Client-side check only for now —
 * before this ships to real users, this validation belongs in a Cloud Function
 * so a malicious client can't bypass the invite-code check entirely.
 */
export async function joinTripByInvite(tripId: string, inviteCode: string, userId: string, userName: string) {
  const tripRef = doc(db, TRIPS_COLLECTION, tripId)
  const snap = await getDoc(tripRef)

  if (!snap.exists()) throw new Error('Trip not found.')
  const trip = snap.data() as Trip

  if (trip.inviteCode !== inviteCode) {
    throw new Error('This invite link is invalid or has expired.')
  }

  if (trip.memberIds.includes(userId)) {
    return // already a member, nothing to do
  }

  await updateDoc(tripRef, {
    memberIds: arrayUnion(userId),
    [`members.${userId}`]: { role: 'editor', joinedAt: Date.now(), name: userName },
  })
}