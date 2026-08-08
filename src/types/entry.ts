export type Entry = {
  id: string
  tripId: string
  createdBy: string
  createdByName: string
  type: 'photo' | 'note' | 'voice'
  mediaUrl?: string
  mediaPublicId?: string // Cloudinary public_id — needed to delete the asset later; absent on entries created before this field existed
  mediaResourceType?: string // Cloudinary resource_type ('image' | 'video' | 'raw') — deletion needs the right bucket
  transcript?: string
  caption: string
  latitude?: number
  longitude?: number
  locationName?: string
  capturedAt: number | null
  createdAt: number
}

export type NewEntry = Omit<Entry, 'id' | 'createdAt'>