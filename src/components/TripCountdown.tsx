import { Calendar, Plane, Camera } from 'lucide-react'

function daysBetween(a: Date, b: Date) {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0)) / msPerDay)
}

export default function TripCountdown({ startDate, endDate }: { startDate: string; endDate: string }) {
  if (!startDate || !endDate) return null

  const today = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  const daysUntilStart = daysBetween(new Date(today), new Date(start))
  const daysUntilEnd = daysBetween(new Date(today), new Date(end))

  let Icon = Calendar
  let text: string

  if (daysUntilStart > 0) {
    text = `${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'} to go`
    Icon = Calendar
  } else if (daysUntilEnd >= 0) {
    const totalDays = daysBetween(new Date(start), new Date(end)) + 1
    const currentDay = totalDays - daysUntilEnd
    text = `Day ${currentDay} of ${totalDays}`
    Icon = Plane
  } else {
    text = `Trip ended ${Math.abs(daysUntilEnd)} ${Math.abs(daysUntilEnd) === 1 ? 'day' : 'days'} ago`
    Icon = Camera
  }

  return (
    <div className="sticker-card inline-flex items-center gap-1.5 px-3 py-1.5 shadow-hard-sm">
      <Icon size={14} />
      <span className="text-[13px] font-semibold">{text}</span>
    </div>
  )
}