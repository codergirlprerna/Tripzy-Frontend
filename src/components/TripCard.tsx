import { Link } from 'react-router-dom'
import { Trip } from '@/types/trip'

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
  return (
    <Link
      to={`/trip/${trip.id}`}
      className="sticker-card block overflow-hidden shadow-hard-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard"
    >
      <div className="h-[140px]" style={{ background: trip.coverColor }} />
      <div className="p-5">
        <h3 className="mb-1.5 font-display text-[17px] font-extrabold">{trip.title}</h3>
        <div className="mb-1 text-[13px] font-medium text-[#4a4460]">📍 {trip.location}</div>
        <div className="font-mono text-[11px] text-[#7a7590]">Created {timeAgo(trip.createdAt)}</div>
      </div>
    </Link>
  )
}