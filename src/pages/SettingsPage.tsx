import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getUserPlan, countOwnedTrips, PLAN_LIMITS, Plan } from '@/lib/users'
import Spinner from '@/components/Spinner'

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  crew: 'Crew',
  crew_annual: 'Crew Annual',
}

export default function SettingsPage() {
  const { currentUser, logOut } = useAuth()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<Plan>('free')
  const [ownedTrips, setOwnedTrips] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    Promise.all([getUserPlan(currentUser.uid), countOwnedTrips(currentUser.uid)]).then(
      ([userPlan, tripCount]) => {
        setPlan(userPlan)
        setOwnedTrips(tripCount)
        setLoading(false)
      },
    )
  }, [currentUser])

  async function handleLogOut() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logOut()
      navigate('/')
    } catch {
      setLoggingOut(false)
    }
  }

  const limits = PLAN_LIMITS[plan]
  const tripLimitLabel = limits.maxOwnedTrips === Infinity ? 'Unlimited' : limits.maxOwnedTrips

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b-[3px] border-ink bg-paper px-8 py-4">
        <div className="mx-auto flex max-w-[720px] items-center justify-between">
          <Link to="/dashboard" className="text-[13px] font-bold text-[#4a4460]">
            ← Back to trips
          </Link>
          <div className="flex items-center gap-2 font-display text-[20px] font-extrabold">
            <span
              className="inline-block h-[24px] w-[24px] -rotate-[8deg] rounded-lg border-[2.5px] border-ink"
              style={{ background: 'linear-gradient(135deg, #ff6ec7, #ffb86b)' }}
            />
            tripzy
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-8 py-12">
        <h1 className="mb-8 font-display text-[28px] font-extrabold">Account settings</h1>

        {/* Account info */}
        <div className="sticker-card mb-6 p-6 shadow-hard-sm">
          <div className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wide text-[#7a7590]">
            Signed in as
          </div>
          <div className="text-[16px] font-bold">{currentUser?.displayName || 'No name set'}</div>
          <div className="text-[13.5px] font-medium text-[#4a4460]">{currentUser?.email}</div>
        </div>

        {/* Plan + usage */}
        <div className="sticker-card mb-6 p-6 shadow-hard-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-mono text-[11px] font-bold uppercase tracking-wide text-[#7a7590]">
              Current plan
            </div>
            <span className="rounded-full border-2 border-ink bg-lime px-3 py-1 text-[12px] font-bold">
              {PLAN_LABELS[plan]}
            </span>
          </div>

          {loading ? (
            <div className="inline-flex items-center gap-2 text-[13.5px] font-medium text-[#4a4460]">
              <Spinner /> Loading usage…
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-[13.5px] font-medium text-[#4a4460]">
              <div className="flex justify-between">
                <span>Trips created</span>
                <span className="font-bold text-ink">
                  {ownedTrips} / {tripLimitLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Travelers per trip</span>
                <span className="font-bold text-ink">{limits.maxTravelersPerTrip}</span>
              </div>
            </div>
          )}

          <button
            onClick={() =>
              alert(
                "Billing isn't connected yet — upgrading here doesn't actually charge anything or change your plan. This needs real payment processing (Stripe or similar) behind it before it's live.",
              )
            }
            className="btn-primary mt-5 w-full !text-center"
          >
            Upgrade to Crew
          </button>
          <p className="mt-2 text-center text-[11.5px] font-medium text-[#a39fb0]">
            Billing isn't wired up yet — this button is a placeholder.
          </p>
        </div>

        {/* Danger zone */}
        <div className="sticker-card p-6 shadow-hard-sm">
          <button onClick={handleLogOut} disabled={loggingOut} className="btn-secondary w-full !text-center disabled:opacity-60">
            {loggingOut ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner /> Logging out…
              </span>
            ) : (
              'Log out'
            )}
          </button>
        </div>
      </main>
    </div>
  )
}