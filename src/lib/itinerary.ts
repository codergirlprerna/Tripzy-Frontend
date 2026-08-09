import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { logAnalyticsEvent } from '@/lib/analytics'
import { NewItineraryItem, ItineraryItem } from '@/types/itinerary'

export function subscribeToItinerary(tripId: string, callback: (items: ItineraryItem[]) => void) {
  // Ordered by day first, then time — items with no time (time: null) sort
  // before timed ones on the same day since Firestore orders null before
  // any string value, which conveniently matches "unscheduled stuff first."
  const q = query(collection(db, 'trips', tripId, 'itinerary'), orderBy('day'), orderBy('time'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ItineraryItem))
  })
}

export async function addItineraryItem(item: NewItineraryItem) {
  await addDoc(collection(db, 'trips', item.tripId, 'itinerary'), {
    ...item,
    createdAt: Date.now(),
  })
  logAnalyticsEvent('itinerary_item_added', { trip_id: item.tripId })
}

export async function updateItineraryItem(
  tripId: string,
  itemId: string,
  updates: Partial<Pick<ItineraryItem, 'day' | 'time' | 'title' | 'locationName' | 'notes'>>,
) {
  await updateDoc(doc(db, 'trips', tripId, 'itinerary', itemId), updates)
}

export async function deleteItineraryItem(tripId: string, itemId: string) {
  await deleteDoc(doc(db, 'trips', tripId, 'itinerary', itemId))
}