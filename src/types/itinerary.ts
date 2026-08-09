export type ItineraryItem = {
  id: string
  tripId: string
  day: string // "YYYY-MM-DD" — must fall within the trip's startDate..endDate range
  time: string | null // "HH:MM" 24h, or null for an unscheduled/all-day item
  title: string
  locationName: string | null
  notes: string
  createdBy: string
  createdByName: string
  createdAt: number
}

export type NewItineraryItem = Omit<ItineraryItem, 'id' | 'createdAt'>