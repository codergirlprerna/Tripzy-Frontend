import { logEvent as firebaseLogEvent } from 'firebase/analytics'
import { analytics } from '@/lib/firebase'

/**
 * Wraps Firebase's logEvent so every call site doesn't need its own
 * null-check — `analytics` is null until the SDK finishes its async support
 * check (see firebase.ts), and stays null forever if there's no
 * measurementId configured or the browser doesn't support it.
 *
 * Event names follow GA4's recommended snake_case convention. Custom
 * parameters show up in the Firebase console under DebugView immediately,
 * and in standard reports within ~24h.
 */
export function logAnalyticsEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (!analytics) return
  firebaseLogEvent(analytics, eventName, params)
}