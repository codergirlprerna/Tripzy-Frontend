export type PollOption = {
  id: string
  text: string
}

export type Message = {
  id: string
  tripId: string
  senderId: string
  senderName: string
  type: 'text' | 'poll'
  text?: string
  pollQuestion?: string
  pollOptions?: PollOption[]
  pollVotes?: Record<string, string> // uid -> optionId
  createdAt: number
}

export type NewTextMessage = {
  tripId: string
  senderId: string
  senderName: string
  text: string
}

export type NewPollMessage = {
  tripId: string
  senderId: string
  senderName: string
  question: string
  optionTexts: string[]
}