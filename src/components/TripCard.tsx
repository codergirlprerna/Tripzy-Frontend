import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Trip } from '@/types/trip'
import DeleteTripModal from '@/components/DeleteTripModal'
import { MapPin, Trash2 } from 'lucide-react'

function timeAgo(timestamp: number) {
  const diffMs = Date.now() - timestamp
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function TripCard({ trip }: { trip: Trip }) {
  const { currentUser } = useAuth()
  const [showDelete, setShowDelete] = useState(false)
  const isOwner = currentUser ? trip.members[currentUser.uid]?.role === 'owner' : false

  return (
    <div className="group relative">
      <Link
        to={`/trip/${trip.id}`}
        className="sticker-card block overflow-hidden shadow-hard-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
      >
        {trip.coverImageUrl ? (
          <img src={trip.coverImageUrl} alt="" className="h-[140px] w-full object-cover object-top" />
        ) : (
          <div className="h-[140px]" style={{ background: trip.coverColor }} />
        )}
        <div className="p-5">
          <h3 className="mb-1.5 font-display text-[17px] font-extrabold">{trip.title}</h3>
          <div className="mb-1 flex items-center gap-1 text-[13px] font-medium text-[#4a4460]">
            <MapPin size={12} className="shrink-0" /> {trip.location}
          </div>
          <div className="font-mono text-[11px] text-[#7a7590]">Created {timeAgo(trip.createdAt)}</div>
        </div>
      </Link>

      {isOwner && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowDelete(true)
          }}
          aria-label="Delete trip"
          title="Delete trip"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-white opacity-0 shadow-hard-sm transition-opacity group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      )}

      {showDelete && <DeleteTripModal trip={trip} onClose={() => setShowDelete(false)} onDeleted={() => setShowDelete(false)} />}
    </div>
  )
}