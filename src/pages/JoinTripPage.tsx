import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { joinTripByInvite } from '@/lib/trips'

export default function JoinTripPage() {
  const { tripId, inviteCode } = useParams<{ tripId: string; inviteCode: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'joining' | 'error'>('joining')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tripId || !inviteCode || !currentUser) return

    const userName = currentUser.displayName || currentUser.email || 'Someone'
    joinTripByInvite(tripId, inviteCode, currentUser.uid, userName)
      .then(() => navigate(`/trip/${tripId}`))
      .catch((err) => {
        setError(err.message || 'Could not join this trip.')
        setStatus('error')
      })
  }, [tripId, inviteCode, currentUser, navigate])

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-[360px] text-[15px] font-semibold">{error}</p>
        <Link to="/dashboard" className="btn-secondary !px-5 !py-3 !text-[14px]">
          Go to your trips
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center text-[14px] font-semibold">
      Joining the trip…
    </div>
  )
}