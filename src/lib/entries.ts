import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import exifr from 'exifr'
import { db, storage } from '@/lib/firebase'
import { reverseGeocode } from '@/lib/geocode'
import { Trip } from '@/types/trip'
import { Entry } from '@/types/entry'

export async function setEntryLocation(
  tripId: string,
  entryId: string,
  latitude: number,
  longitude: number,
  locationName: string,
) {
  await updateDoc(doc(db, 'trips', tripId, 'entries', entryId), {
    latitude,
    longitude,
    locationName,
  })
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  const snap = await getDoc(doc(db, 'trips', tripId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Trip
}

export function subscribeToTripEntries(tripId: string, callback: (entries: Entry[]) => void) {
  const entriesQuery = query(
    collection(db, 'trips', tripId, 'entries'),
    orderBy('capturedAt', 'desc'),
  )

  return onSnapshot(entriesQuery, (snapshot) => {
    const entries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Entry[]
    callback(entries)
  })
}

/**
 * Uploads a photo file, reads its EXIF date + GPS coordinates (if present),
 * stores the file in Firebase Storage, and writes the entry to Firestore.
 * Falls back gracefully — a photo with no EXIF data still uploads fine,
 * it just won't have an auto-detected date or location.
 */
export async function addPhotoEntry(tripId: string, userId: string, userName: string, file: File) {
  let capturedAt: number | null = null
  let latitude: number | undefined
  let longitude: number | undefined

  try {
    const exifData = await exifr.parse(file, { gps: true, pick: ['DateTimeOriginal', 'latitude', 'longitude'] })
    if (exifData?.DateTimeOriginal) {
      capturedAt = new Date(exifData.DateTimeOriginal).getTime()
    }
    if (typeof exifData?.latitude === 'number' && typeof exifData?.longitude === 'number') {
      latitude = exifData.latitude
      longitude = exifData.longitude
    }
  } catch {
    // No EXIF data or unreadable — that's fine, we just skip auto-tagging for this photo.
  }

  const storagePath = `trips/${tripId}/${Date.now()}-${file.name}`
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file)
  const mediaUrl = await getDownloadURL(storageRef)

  let locationName: string | null = null
  if (latitude !== undefined && longitude !== undefined) {
    locationName = await reverseGeocode(latitude, longitude)
  }

  await addDoc(collection(db, 'trips', tripId, 'entries'), {
    tripId,
    createdBy: userId,
    createdByName: userName,
    type: 'photo',
    mediaUrl,
    caption: '',
    latitude,
    longitude,
    locationName,
    capturedAt: capturedAt ?? Date.now(),
    createdAt: Date.now(),
  })
}