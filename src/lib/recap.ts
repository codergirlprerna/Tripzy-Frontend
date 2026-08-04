import { Entry } from '@/types/entry'
import { Trip } from '@/types/trip'

export type RecapStats = {
  photoCount: number
  dayCount: number
  memberCount: number
  highlightEntries: Entry[]
  bestDay: { date: string; count: number } | null
}

export function computeRecapStats(trip: Trip, entries: Entry[]): RecapStats {
  const photoEntries = entries.filter((e) => e.type === 'photo' && e.mediaUrl)

  const start = new Date(trip.startDate)
  const end = new Date(trip.endDate)
  const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)

  // Group photos by the calendar day they were captured, to find the busiest day.
  const countsByDay = new Map<string, number>()
  for (const entry of photoEntries) {
    if (!entry.capturedAt) continue
    const dayKey = new Date(entry.capturedAt).toDateString()
    countsByDay.set(dayKey, (countsByDay.get(dayKey) || 0) + 1)
  }

  let bestDay: RecapStats['bestDay'] = null
  for (const [date, count] of countsByDay.entries()) {
    if (!bestDay || count > bestDay.count) {
      bestDay = { date, count }
    }
  }

  // Highlight photos: most recent 2, as a simple stand-in for a "best photos" heuristic.
  const highlightEntries = [...photoEntries]
    .sort((a, b) => (b.capturedAt || 0) - (a.capturedAt || 0))
    .slice(0, 2)

  return {
    photoCount: photoEntries.length,
    dayCount,
    memberCount: trip.memberIds.length,
    highlightEntries,
    bestDay,
  }
}