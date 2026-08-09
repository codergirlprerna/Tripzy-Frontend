import { useState, FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Trip } from '@/types/trip'
import { ItineraryItem } from '@/types/itinerary'
import { addItineraryItem, updateItineraryItem } from '@/lib/itinerary'
import Spinner from '@/components/Spinner'

type Props = {
  trip: Trip
  editingItem: ItineraryItem | null
  defaultDay: string
  onClose: () => void
}

export default function AddItineraryItemModal({ trip, editingItem, defaultDay, onClose }: Props) {
  const { currentUser } = useAuth()
  const [day, setDay] = useState(editingItem?.day || defaultDay)
  const [time, setTime] = useState(editingItem?.time || '')
  const [title, setTitle] = useState(editingItem?.title || '')
  const [locationName, setLocationName] = useState(editingItem?.locationName || '')
  const [notes, setNotes] = useState(editingItem?.notes || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!currentUser || !title.trim()) return
    setSubmitting(true)
    setError('')
    try {
      if (editingItem) {
        await updateItineraryItem(trip.id, editingItem.id, {
          day,
          time: time || null,
          title: title.trim(),
          locationName: locationName.trim() || null,
          notes: notes.trim(),
        })
      } else {
        await addItineraryItem({
          tripId: trip.id,
          day,
          time: time || null,
          title: title.trim(),
          locationName: locationName.trim() || null,
          notes: notes.trim(),
          createdBy: currentUser.uid,
          createdByName: currentUser.displayName || 'Someone',
        })
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4 py-8">
      <div className="sticker-card w-full max-w-[440px] p-7 shadow-hard">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-[19px] font-extrabold">{editingItem ? 'Edit plan' : 'Add to itinerary'}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-ink text-[16px] font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-[12px] font-bold text-[#4a4460]">Day</label>
              <input
                type="date"
                value={day}
                min={trip.startDate}
                max={trip.endDate}
                onChange={(e) => setDay(e.target.value)}
                required
                className="w-full rounded-lg border-2 border-ink px-3 py-2.5 text-[13.5px] font-medium outline-none"
              />
            </div>
            <div className="w-[130px]">
              <label className="mb-1.5 block text-[12px] font-bold text-[#4a4460]">Time (optional)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border-2 border-ink px-3 py-2.5 text-[13.5px] font-medium outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[#4a4460]">What's happening</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hike to the viewpoint"
              required
              maxLength={120}
              className="w-full rounded-lg border-2 border-ink px-3 py-2.5 text-[13.5px] font-medium outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[#4a4460]">Location (optional)</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Anjuna Beach"
              maxLength={120}
              className="w-full rounded-lg border-2 border-ink px-3 py-2.5 text-[13.5px] font-medium outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[#4a4460]">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full resize-none rounded-lg border-2 border-ink px-3 py-2.5 text-[13.5px] font-medium outline-none"
            />
          </div>

          {error && <p className="text-[12.5px] font-semibold text-[#c0325f]">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full !text-center disabled:opacity-60">
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner /> Saving…
              </span>
            ) : editingItem ? (
              'Save changes'
            ) : (
              'Add to itinerary'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}