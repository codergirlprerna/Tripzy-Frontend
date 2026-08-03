import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ReactNode } from 'react'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-[14px] font-semibold">Loading…</div>
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}