import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import OfflineSyncBanner from '@/components/OfflineSyncBanner'
import PushNotifications from '@/components/PushNotifications'
import AnalyticsPageViewTracker from '@/components/AnalyticsPageViewTracker'

// Lazy-loaded so each route only downloads its own code, on demand — this
// is what actually fixes "the app takes long to load": before this, every
// visitor paid for Firebase + Leaflet (map) + jsPDF/html2canvas (recap
// export) + every page and modal in ONE 1.7MB bundle, even someone just
// looking at the login page. Now the login page loads without map/PDF
// libraries at all, and the map/recap code only downloads when someone
// actually opens a trip and uses those features.
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const SignupPage = lazy(() => import('@/pages/SignupPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const TripDetailPage = lazy(() => import('@/pages/TripDetailPage'))
const JoinTripPage = lazy(() => import('@/pages/JoinTripPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

function PageLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink border-t-transparent" />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <OfflineSyncBanner />
      <PushNotifications />
      <AnalyticsPageViewTracker />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip/:tripId"
            element={
              <ProtectedRoute>
                <TripDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join/:tripId/:inviteCode"
            element={
              <ProtectedRoute>
                <JoinTripPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App