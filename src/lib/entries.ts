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
import exifr from 'exifr'
import { db } from '@/lib/firebase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { reverseGeocode } from '@/lib/geocode'
import { Trip } from '@/types/trip'
import { Entry } from '@/types/entry'

export async function addVoiceEntry(
  tripId: string,
  userId: string,
  userName: string,
  audioBlob: Blob,
  transcript: string,
) {
  const mediaUrl = await uploadToCloudinary(audioBlob, `voice-${Date.now()}.webm`)

  await addDoc(collection(db, 'trips', tripId, 'entries'), {
    tripId,
    createdBy: userId,
    createdByName: userName,
    type: 'voice',
    mediaUrl,
    transcript,
    caption: '',
    capturedAt: Date.now(),
    createdAt: Date.now(),
  })
}

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
 * Uploads a photo, reads its EXIF date + GPS coordinates, stores it in Firebase
 * Storage, and writes the entry to Firestore.
 *
 * `exifSourceFile` and `uploadBlob` are deliberately separate: once a photo has
 * been cropped or rotated, the edited output is a brand-new canvas-rendered
 * image with NO EXIF data at all (canvas re-encoding always strips it). So EXIF
 * must be read from the original, untouched file, while the edited version is
 * what actually gets uploaded. If a photo was never edited, both params are
 * just the same original file.
 */
export async function addPhotoEntry(
  tripId: string,
  userId: string,
  userName: string,
  exifSourceFile: File,
  uploadBlob: Blob,
  fileName: string,
) {
  let capturedAt: number | null = null
  let latitude: number | undefined
  let longitude: number | undefined

  try {
    const exifData = await exifr.parse(exifSourceFile, {
      gps: true,
      pick: ['DateTimeOriginal', 'latitude', 'longitude'],
    })
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

  const mediaUrl = await uploadToCloudinary(uploadBlob, fileName)

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
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    locationName,
    capturedAt: capturedAt ?? Date.now(),
    createdAt: Date.now(),
  })
}