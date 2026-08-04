import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getTrip, subscribeToTripEntries, addPhotoEntry } from '@/lib/entries'
import { subscribeToTripExpenses } from '@/lib/expenses'
import { Trip } from '@/types/trip'
import { Entry } from '@/types/entry'
import { Expense } from '@/types/expense'
import EntryCard from '@/components/EntryCard'
import RecapModal from '@/components/RecapModal'
import TripMap from '@/components/TripMap'
import ExpensesView from '@/components/ExpensesView'
import AddExpenseModal from '@/components/AddExpenseModal'

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showRecap, setShowRecap] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [view, setView] = useState<'photos' | 'map' | 'expenses'>('photos')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tripId) return

    getTrip(tripId).then((data) => {
      setTrip(data)
      setLoading(false)
    })

    const unsubscribeEntries = subscribeToTripEntries(tripId, setEntries)
    const unsubscribeExpenses = subscribeToTripExpenses(tripId, setExpenses)
    return () => {
      unsubscribeEntries()
      unsubscribeExpenses()
    }
  }, [tripId])

  function handleCopyInvite() {
    if (!trip) return
    const link = `${window.location.origin}/join/${trip.id}/${trip.inviteCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !tripId || !currentUser) return

    setUploading(true)
    setUploadError('')
    try {
      const userName = currentUser.displayName || currentUser.email || 'Someone'
      for (const file of Array.from(files)) {
        await addPhotoEntry(tripId, currentUser.uid, userName, file)
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-[14px] font-semibold">Loading…</div>
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-[15px] font-semibold">Trip not found.</p>
        <Link to="/dashboard" className="btn-secondary !px-5 !py-3 !text-[14px]">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="h-[220px]" style={{ background: trip.coverColor }} />

      <div className="mx-auto max-w-[1180px] px-8">
        <div className="-mt-10 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="sticker-card bg-white px-6 py-5 shadow-hard-sm">
            <button onClick={() => navigate('/dashboard')} className="mb-2 text-[12px] font-bold text-[#4a4460]">
              ← Back to trips
            </button>
            <h1 className="font-display text-[26px] font-extrabold">{trip.title}</h1>
            <div className="mt-1 text-[14px] font-medium text-[#4a4460]">
              📍 {trip.location} · {trip.startDate} → {trip.endDate}
            </div>
            {trip.description && (
              <p className="mt-2 max-w-[500px] text-[13.5px] font-medium text-[#4a4460]">{trip.description}</p>
            )}
            <div className="mt-2 font-mono text-[11px] font-semibold text-[#7a7590]">
              👯 {trip.memberIds.length} {trip.memberIds.length === 1 ? 'person' : 'people'} on this trip
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleCopyInvite} className="btn-secondary !px-5 !py-3 !text-[14px]">
              {copied ? 'Link copied!' : '+ Invite'}
            </button>
            <button onClick={() => setShowRecap(true)} className="btn-secondary !px-5 !py-3 !text-[14px]">
              View recap
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className={`btn-primary inline-block cursor-pointer !px-5 !py-3 !text-[14px] ${
                uploading ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {uploading ? 'Uploading…' : '+ Add photos'}
            </label>
          </div>
        </div>

        {uploadError && (
          <div className="mb-6 rounded-xl border-[2px] border-ink bg-pink/20 px-4 py-3 text-[13px] font-semibold text-ink">
            {uploadError}
          </div>
        )}

        <div className="pb-16">
          <div className="mb-6 inline-flex gap-1 rounded-full border-[2.5px] border-ink bg-white p-1">
            <button
              onClick={() => setView('photos')}
              className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                view === 'photos' ? 'bg-ink text-white' : 'text-ink'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setView('map')}
              className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                view === 'map' ? 'bg-ink text-white' : 'text-ink'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setView('expenses')}
              className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                view === 'expenses' ? 'bg-ink text-white' : 'text-ink'
              }`}
            >
              Expenses
            </button>
          </div>

          {view === 'expenses' && (
            <div className="mb-6 flex justify-end">
              <button onClick={() => setShowAddExpense(true)} className="btn-primary !px-5 !py-3 !text-[14px]">
                + Add expense
              </button>
            </div>
          )}

          {view === 'photos' ? (
            entries.length === 0 ? (
              <div className="py-16 text-center text-[14.5px] font-medium text-[#4a4460]">
                No photos yet — add some to start building the timeline.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {entries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            )
          ) : view === 'map' ? (
            <TripMap entries={entries} />
          ) : (
            <ExpensesView trip={trip} expenses={expenses} />
          )}
        </div>
      </div>

      {showRecap && <RecapModal trip={trip} entries={entries} onClose={() => setShowRecap(false)} />}
      {showAddExpense && <AddExpenseModal trip={trip} onClose={() => setShowAddExpense(false)} />}
    </div>
  )
}