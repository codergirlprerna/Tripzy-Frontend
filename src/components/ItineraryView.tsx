import { useState } from 'react'
import { Trip } from '@/types/trip'
import { ItineraryItem } from '@/types/itinerary'
import { deleteItineraryItem } from '@/lib/itinerary'
import { MapPin } from 'lucide-react'

type Props = {
  trip: Trip
  items: ItineraryItem[]
  canEdit: boolean
  onEditItem: (item: ItineraryItem) => void
}

/** Every calendar day from trip.startDate to trip.endDate, inclusive, as "YYYY-MM-DD" strings. */
function getTripDays(startDate: string, endDate: string): string[] {
  const days: string[] = []
  const cursor = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days.length > 0 ? days : [startDate]
}

function formatDayLabel(day: string, index: number): string {
  const date = new Date(day + 'T00:00:00')
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' })
  const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `Day ${index + 1} · ${weekday} ${monthDay}`
}

function formatTime(time: string | null): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export default function ItineraryView({ trip, items, canEdit, onEditItem }: Props) {
  const tripDays = getTripDays(trip.startDate, trip.endDate)
  const [activeDay, setActiveDay] = useState(tripDays[0])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const dayItems = items.filter((item) => item.day === activeDay)

  async function handleDelete(itemId: string) {
    setDeletingId(itemId)
    try {
      await deleteItineraryItem(trip.id, itemId)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tripDays.map((day, i) => {
          const count = items.filter((item) => item.day === day).length
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`shrink-0 rounded-full border-2 border-ink px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
                activeDay === day ? 'bg-ink text-white' : 'bg-white text-ink'
              }`}
            >
              {formatDayLabel(day, i)}
              {count > 0 && <span className="ml-1.5 font-mono text-[10.5px] opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {dayItems.length === 0 ? (
        <div className="py-16 text-center text-[14.5px] font-medium text-[#4a4460]">
          Nothing planned for this day yet{canEdit ? ' — add the first thing.' : '.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dayItems.map((item) => (
            <div key={item.id} className="sticker-card flex items-start justify-between gap-4 p-4 shadow-hard-sm">
              <div className="flex gap-3">
                <div className="w-[70px] shrink-0 pt-0.5 font-mono text-[12px] font-bold text-[#7a7590]">
                  {formatTime(item.time) || 'Anytime'}
                </div>
                <div>
                  <div className="font-display text-[15px] font-extrabold">{item.title}</div>
                  {item.locationName && (
                    <div className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-[#4a4460]">
                      <MapPin size={11} className="shrink-0" /> {item.locationName}
                    </div>
                  )}
                  {item.notes && <div className="mt-1 text-[12.5px] font-medium text-[#4a4460]">{item.notes}</div>}
                  <div className="mt-1 font-mono text-[10.5px] font-semibold text-[#a39fb0]">
                    Added by {item.createdByName}
                  </div>
                </div>
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => onEditItem(item)}
                    className="text-[11px] font-bold text-[#4a4460] underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-[11px] font-bold text-[#c9403a] disabled:opacity-60"
                  >
                    {deletingId === item.id ? '…' : 'Remove'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}