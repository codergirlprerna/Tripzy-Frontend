import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { logAnalyticsEvent } from '@/lib/analytics'

/**
 * Firebase Analytics auto-logs a page_view on the very first load, but React
 * Router changes routes client-side without a real page navigation, so
 * nothing fires again after that — every route past the first looks
 * invisible in the Firebase console without this.
 */
export default function AnalyticsPageViewTracker() {
  const location = useLocation()

  useEffect(() => {
    logAnalyticsEvent('page_view', {
      page_path: location.pathname,
      page_location: window.location.href,
    })
  }, [location.pathname])

  return null
}