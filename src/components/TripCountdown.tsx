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

  let label: string

  if (daysUntilStart > 0) {
    label = `🗓️ ${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'} to go`
  } else if (daysUntilEnd >= 0) {
    const totalDays = daysBetween(new Date(start), new Date(end)) + 1
    const currentDay = totalDays - daysUntilEnd
    label = `✈️ Day ${currentDay} of ${totalDays}`
  } else {
    label = `📸 Trip ended ${Math.abs(daysUntilEnd)} ${Math.abs(daysUntilEnd) === 1 ? 'day' : 'days'} ago`
  }

  return (
    <div className="sticker-card inline-flex items-center px-3 py-1.5 shadow-hard-sm">
      <span className="text-[13px] font-semibold">{label}</span>
    </div>
  )
}