import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { subscribeToUserTrips } from '@/lib/trips'
import { Trip } from '@/types/trip'
import TripCard from '@/components/TripCard'
import CreateTripModal from '@/components/CreateTripModal'

export default function DashboardPage() {
  const { currentUser, logOut } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loadingTrips, setLoadingTrips] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const unsubscribe = subscribeToUserTrips(currentUser.uid, (data) => {
      setTrips(data)
      setLoadingTrips(false)
    })
    return unsubscribe
  }, [currentUser])

  async function handleLogOut() {
    await logOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b-[3px] border-ink bg-paper px-8 py-4">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between">
          <div className="flex items-center gap-2 font-display text-[22px] font-extrabold">
            <span
              className="inline-block h-[26px] w-[26px] -rotate-[8deg] rounded-lg border-[2.5px] border-ink"
              style={{ background: 'linear-gradient(135deg, #ff6ec7, #ffb86b)' }}
            />
            tripzy
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[14px] font-semibold text-[#4a4460]">
              {currentUser?.displayName || currentUser?.email}
            </span>
            <button onClick={handleLogOut} className="btn-secondary !px-4 !py-2 !text-[13px]">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-8 py-12">
        {loadingTrips ? (
          <div className="py-20 text-center text-[14px] font-semibold text-[#4a4460]">Loading your trips…</div>
        ) : trips.length === 0 ? (
          <div className="mx-auto max-w-[420px] py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-[2.5px] border-ink bg-lime text-3xl">
              ✈️
            </div>
            <h1 className="mb-2 font-display text-[26px] font-extrabold">No trips yet</h1>
            <p className="mb-7 text-[14.5px] font-medium text-[#4a4460]">
              Start documenting your adventures by creating your first trip.
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Create your first trip
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <h1 className="font-display text-[26px] font-extrabold">Your trips</h1>
              <button onClick={() => setShowModal(true)} className="btn-primary !px-5 !py-3 !text-[14px]">
                + New trip
              </button>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        )}
      </main>

      {showModal && <CreateTripModal onClose={() => setShowModal(false)} />}
    </div>
  )
}