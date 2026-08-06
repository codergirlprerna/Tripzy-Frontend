import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import LandingPage from '@/pages/LandingPage'
import SignupPage from '@/pages/SignupPage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import TripDetailPage from '@/pages/TripDetailPage'
import JoinTripPage from '@/pages/JoinTripPage'
import SettingsPage from '@/pages/SettingsPage'
import OfflineSyncBanner from '@/components/OfflineSyncBanner'

function App() {
  return (
    <AuthProvider>
      <OfflineSyncBanner />
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
    </AuthProvider>
  )
}

export default App