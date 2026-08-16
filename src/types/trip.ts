export type TripRole = 'owner' | 'editor' | 'viewer'

export type Trip = {
  id: string
  ownerId: string
  title: string
  location: string
  latitude?: number
  longitude?: number
  description: string
  startDate: string
  endDate: string
  coverColor: string
  coverImageUrl?: string // if set, a custom uploaded cover photo takes precedence over coverColor
  createdAt: number
  memberIds: string[]
  members: Record<string, { role: TripRole; joinedAt: number; name: string }>
  inviteCode: string
}

export type NewTrip = Omit<Trip, 'id' | 'createdAt' | 'memberIds' | 'members' | 'inviteCode'>