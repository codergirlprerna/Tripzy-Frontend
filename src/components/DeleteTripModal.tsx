import { useState } from 'react'
import { Trip } from '@/types/trip'
import { deleteTrip } from '@/lib/trips'
import { useAuth } from '@/context/AuthContext'

type Props = {
  trip: Trip
  onClose: () => void
  onDeleted: () => void
}

export default function DeleteTripModal({ trip, onClose, onDeleted }: Props) {
  const { currentUser } = useAuth()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const canDelete = confirmText.trim() === trip.title

  async function handleDelete() {
    if (!canDelete || !currentUser) return
    setDeleting(true)
    setError('')
    try {
      const cloudinaryCleanupOk = await deleteTrip(currentUser, trip.id)
      if (!cloudinaryCleanupOk) {
        // The trip itself is gone either way — this only means some photo/
        // voice files may still be sitting in Cloudinary storage. Not worth
        // blocking on, but worth a heads-up rather than pretending it's clean.
        console.warn(`Trip ${trip.id} deleted, but some Cloudinary assets may not have been cleaned up.`)
      }
      onDeleted()
    } catch (err: any) {
      setError(err.message || 'Something went wrong deleting this trip. Try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4 py-8">
      <div className="sticker-card w-full max-w-[420px] p-7 shadow-hard">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[19px] font-extrabold">Delete trip</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-ink text-[16px] font-bold"
          >
            ×
          </button>
        </div>

        <p className="text-[13.5px] font-medium leading-relaxed text-[#4a4460]">
          This permanently deletes <span className="font-bold text-ink">{trip.title}</span> — every photo, voice
          note, message, and expense on it. Everyone on the trip loses access immediately. This can't be undone.
        </p>

        <label className="mt-5 block text-[12px] font-bold text-[#4a4460]">
          Type <span className="font-mono text-ink">{trip.title}</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={trip.title}
          className="mt-2 w-full rounded-lg border-[2px] border-ink px-3 py-2.5 text-[13.5px] font-medium outline-none"
          autoFocus
        />

        {error && <p className="mt-3 text-[12.5px] font-semibold text-[#c0325f]">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 !px-4 !py-2.5 !text-[13.5px]">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="flex-1 rounded-full border-[2.5px] border-ink bg-[#c0325f] px-4 py-2.5 text-[13.5px] font-bold text-white shadow-hard-sm transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:pointer-events-none disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}