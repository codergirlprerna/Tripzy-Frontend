import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { currentUser, logOut } = useAuth()
  const navigate = useNavigate()

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

      <main className="mx-auto max-w-[1180px] px-8 py-16 text-center">
        <div className="mx-auto max-w-[420px]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-[2.5px] border-ink bg-lime text-3xl">
            ✈️
          </div>
          <h1 className="mb-2 font-display text-[26px] font-extrabold">No trips yet</h1>
          <p className="mb-7 text-[14.5px] font-medium text-[#4a4460]">
            Start documenting your adventures by creating your first trip.
          </p>
          <button className="btn-primary">Create your first trip</button>
        </div>
      </main>
    </div>
  )
}