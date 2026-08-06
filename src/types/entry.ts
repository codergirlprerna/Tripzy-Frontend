export type Entry = {
  id: string
  tripId: string
  createdBy: string
  createdByName: string
  type: 'photo' | 'note' | 'voice'
  mediaUrl?: string
  transcript?: string
  caption: string
  latitude?: number
  longitude?: number
  locationName?: string
  capturedAt: number | null
  createdAt: number
}

export type NewEntry = Omit<Entry, 'id' | 'createdAt'>