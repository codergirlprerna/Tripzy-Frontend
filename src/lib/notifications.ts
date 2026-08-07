import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type ActivityItem = {
  id: string
  tripId: string
  kind: 'photo' | 'voice' | 'message' | 'expense'
  actorId: string
  actorName: string
  summary: string
  createdAt: number
}

const LAST_SEEN_PREFIX = 'tripzy:lastSeen:'

export function getLastSeen(tripId: string): number {
  const raw = localStorage.getItem(LAST_SEEN_PREFIX + tripId)
  return raw ? Number(raw) : 0
}

export function markSeen(tripId: string) {
  localStorage.setItem(LAST_SEEN_PREFIX + tripId, String(Date.now()))
}

/**
 * IMPORTANT LIMITATION — read this before assuming this is "push notifications":
 *
 * This only delivers activity while the trip is open in an active browser tab,
 * via Firestore's onSnapshot real-time listeners. It does NOT notify a user
 * whose tab is closed, backgrounded, or whose phone is locked — that requires
 * a genuinely different mechanism:
 *   1. Firebase Cloud Messaging (FCM) + a registered service worker to receive
 *      pushes while the app isn't in the foreground.
 *   2. A server-side trigger (a Cloud Function on `onCreate` for entries/
 *      messages/expenses) that calls the FCM Admin SDK to actually send the
 *      push — the client can't send itself a push from inside Firestore rules.
 *   3. Per-user device tokens stored somewhere (e.g. `users/{uid}.fcmTokens`)
 *      and a user-facing permission prompt (`Notification.requestPermission`).
 * None of that is wired up here. What's below is "live updates while the tab
 * is open," which is real and useful, but it's not the same guarantee as a
 * phone buzzing in someone's pocket — don't market it as that without doing
 * the FCM work above.
 */
export function subscribeToTripActivity(tripId: string, callback: (items: ActivityItem[]) => void) {
  const unsubscribers: Array<() => void> = []
  const latest = { entries: [] as ActivityItem[], messages: [] as ActivityItem[], expenses: [] as ActivityItem[] }

  function emit() {
    const merged = [...latest.entries, ...latest.messages, ...latest.expenses].sort((a, b) => b.createdAt - a.createdAt)
    callback(merged.slice(0, 30))
  }

  const entriesQuery = query(collection(db, 'trips', tripId, 'entries'), orderBy('createdAt', 'desc'), limit(15))
  unsubscribers.push(
    onSnapshot(entriesQuery, (snapshot) => {
      latest.entries = snapshot.docs.map((d) => {
        const data = d.data() as any
        return {
          id: d.id,
          tripId,
          kind: data.type === 'voice' ? 'voice' : 'photo',
          actorId: data.createdBy,
          actorName: data.createdByName || 'Someone',
          summary: data.type === 'voice' ? 'added a voice note' : 'added a photo',
          createdAt: data.createdAt,
        } as ActivityItem
      })
      emit()
    }),
  )

  const messagesQuery = query(collection(db, 'trips', tripId, 'messages'), orderBy('createdAt', 'desc'), limit(15))
  unsubscribers.push(
    onSnapshot(messagesQuery, (snapshot) => {
      latest.messages = snapshot.docs.map((d) => {
        const data = d.data() as any
        return {
          id: d.id,
          tripId,
          kind: 'message',
          actorId: data.senderId,
          actorName: data.senderName || 'Someone',
          summary: data.type === 'poll' ? `started a poll: "${data.pollQuestion}"` : `sent a message`,
          createdAt: data.createdAt,
        } as ActivityItem
      })
      emit()
    }),
  )

  const expensesQuery = query(collection(db, 'trips', tripId, 'expenses'), orderBy('createdAt', 'desc'), limit(15))
  unsubscribers.push(
    onSnapshot(expensesQuery, (snapshot) => {
      latest.expenses = snapshot.docs.map((d) => {
        const data = d.data() as any
        return {
          id: d.id,
          tripId,
          kind: 'expense',
          actorId: data.paidBy,
          actorName: data.paidByName || 'Someone',
          summary: `added an expense: ${data.description} (${data.currency} ${data.amount})`,
          createdAt: data.createdAt,
        } as ActivityItem
      })
      emit()
    }),
  )

  return () => unsubscribers.forEach((u) => u())
}