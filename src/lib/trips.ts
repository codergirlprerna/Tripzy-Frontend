import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  deleteField,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { logAnalyticsEvent } from '@/lib/analytics'
import { deleteCloudinaryAssets } from '@/lib/cloudinaryCleanup'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { NewTrip, Trip, TripRole } from '@/types/trip'
import { User } from 'firebase/auth'

const TRIPS_COLLECTION = 'trips'

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 10)
}

export async function createTrip(trip: NewTrip, ownerName: string): Promise<string> {
  const inviteCode = generateInviteCode()
  const now = Date.now()

  const docRef = await addDoc(collection(db, TRIPS_COLLECTION), {
    ...trip,
    createdAt: now,
    memberIds: [trip.ownerId],
    members: {
      [trip.ownerId]: { role: 'owner', joinedAt: now, name: ownerName },
    },
    inviteCode,
  })
  logAnalyticsEvent('trip_created', { location: trip.location })
  return docRef.id
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
 * Uploads a cropped cover-photo blob to Cloudinary and saves the URL onto
 * the trip doc. Doesn't touch coverColor — if coverImageUrl is ever cleared
 * (removeTripCoverPhoto below), the trip falls back to whatever gradient
 * was chosen at creation, so removing a photo cover never leaves a trip
 * with no cover at all.
 */
export async function updateTripCoverPhoto(tripId: string, imageBlob: Blob): Promise<string> {
  const upload = await uploadToCloudinary(imageBlob, `cover-${tripId}-${Date.now()}.jpg`)
  await updateDoc(doc(db, TRIPS_COLLECTION, tripId), { coverImageUrl: upload.url })
  logAnalyticsEvent('trip_cover_photo_set', { trip_id: tripId })
  return upload.url
}

export async function removeTripCoverPhoto(tripId: string) {
  await updateDoc(doc(db, TRIPS_COLLECTION, tripId), { coverImageUrl: deleteField() })
}

export async function setMemberRole(tripId: string, uid: string, role: TripRole) {
  await updateDoc(doc(db, TRIPS_COLLECTION, tripId), {
    [`members.${uid}.role`]: role,
  })
}

export async function removeMember(tripId: string, uid: string) {
  await updateDoc(doc(db, TRIPS_COLLECTION, tripId), {
    memberIds: arrayRemove(uid),
    [`members.${uid}`]: deleteField(),
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

  // Traveler limit is based on the TRIP OWNER's plan, not the joiner's —
  // it's the owner's subscription that determines how big their trip can get.
  const { getUserPlan, PLAN_LIMITS } = await import('@/lib/users')
  const ownerPlan = await getUserPlan(trip.ownerId)
  if (trip.memberIds.length >= PLAN_LIMITS[ownerPlan].maxTravelersPerTrip) {
    throw new Error(
      `This trip is full — the owner's plan allows up to ${PLAN_LIMITS[ownerPlan].maxTravelersPerTrip} travelers per trip.`,
    )
  }

  await updateDoc(tripRef, {
    memberIds: arrayUnion(userId),
    [`members.${userId}`]: { role: 'editor', joinedAt: Date.now(), name: userName },
  })
  logAnalyticsEvent('trip_joined', { trip_id: tripId })
}

/**
 * Best-effort fallback for entries created before mediaPublicId/mediaResourceType
 * were stored (see lib/cloudinary.ts) — Cloudinary URLs encode both values in
 * a predictable shape:
 *   https://res.cloudinary.com/<cloud>/<resource_type>/upload/v<version>/<public_id>.<ext>
 * Returns null for anything that doesn't match (already-deleted assets,
 * external URLs, malformed data) rather than guessing.
 */
function parseCloudinaryUrl(url: string): { publicId: string; resourceType: string } | null {
  const match = url.match(/\/([a-z]+)\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/)
  if (!match) return null
  return { resourceType: match[1], publicId: match[2] }
}

/**
 * Deletes a trip AND everything under it — entries, messages, expenses, and
 * (as of this version) the actual photo/voice files on Cloudinary, not just
 * the Firestore records pointing at them.
 *
 * Ordering matters here: Cloudinary cleanup runs FIRST, while the trip
 * document and its member list still exist, because the server-side
 * ownership check (api/delete-cloudinary-assets.ts) reads exactly that data
 * to confirm the caller is actually allowed to delete these files. Deleting
 * Firestore first would leave nothing for that check to verify against.
 *
 * `user` needs to be the actual Firebase Auth User (not just a uid string) —
 * the Cloudinary cleanup call authenticates with a Firebase ID token, which
 * only a live User object can produce (see lib/cloudinaryCleanup.ts).
 *
 * Returns true if Cloudinary cleanup fully succeeded, false if it partially
 * or fully failed. Either way, the trip and its Firestore data are still
 * deleted — a Cloudinary hiccup (rate limit, transient network error)
 * shouldn't leave someone stuck with a trip they can't get rid of. A false
 * return just means some files may be lingering in Cloudinary storage;
 * check the browser console for what failed.
 */
export async function deleteTrip(user: User, tripId: string): Promise<boolean> {
  const entriesSnap = await getDocs(collection(db, TRIPS_COLLECTION, tripId, 'entries'))

  const assets = entriesSnap.docs
    .map((d) => {
      const data = d.data() as any
      if (data.mediaPublicId && data.mediaResourceType) {
        return { publicId: data.mediaPublicId as string, resourceType: data.mediaResourceType as string }
      }
      if (data.mediaUrl) return parseCloudinaryUrl(data.mediaUrl)
      return null
    })
    .filter((asset): asset is { publicId: string; resourceType: string } => asset !== null)

  const cloudinaryCleanupOk = await deleteCloudinaryAssets(user, tripId, assets)

  const subcollections = ['entries', 'messages', 'expenses', 'itinerary']
  for (const sub of subcollections) {
    // Reuse the already-fetched snapshot for 'entries' instead of a second read.
    const snap = sub === 'entries' ? entriesSnap : await getDocs(collection(db, TRIPS_COLLECTION, tripId, sub))
    // Batched writes cap at 500 ops — fine for a trip's normal volume, but
    // a trip with a huge amount of activity would need chunking into
    // multiple batches (or a server-side recursive delete) instead.
    const batch = writeBatch(db)
    snap.docs.forEach((d) => batch.delete(d.ref))
    if (!snap.empty) await batch.commit()
  }

  await deleteDoc(doc(db, TRIPS_COLLECTION, tripId))
  logAnalyticsEvent('trip_deleted', { trip_id: tripId })
  return cloudinaryCleanupOk
}