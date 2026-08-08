import { logEvent as firebaseLogEvent } from 'firebase/analytics'
import { analytics } from '@/lib/firebase'

/**
 * Wraps Firebase Analytics' logEvent so every call site doesn't need its own
 * null-check — analytics can be null if the browser doesn't support it, or if
 * no GA4 property is linked to this Firebase project yet.
 */
export function logAnalyticsEvent(eventName: string, params?: Record<string, any>) {
  if (!analytics) return
  firebaseLogEvent(analytics, eventName, params)
}