import { collection, addDoc, doc, updateDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { NewTextMessage, NewPollMessage, Message } from '@/types/message'

export async function sendTextMessage(message: NewTextMessage) {
  await addDoc(collection(db, 'trips', message.tripId, 'messages'), {
    tripId: message.tripId,
    senderId: message.senderId,
    senderName: message.senderName,
    type: 'text',
    text: message.text,
    createdAt: Date.now(),
  })
}

export async function sendPollMessage(message: NewPollMessage) {
  const options = message.optionTexts
    .filter((t) => t.trim())
    .map((text, i) => ({ id: String(i), text }))

  await addDoc(collection(db, 'trips', message.tripId, 'messages'), {
    tripId: message.tripId,
    senderId: message.senderId,
    senderName: message.senderName,
    type: 'poll',
    pollQuestion: message.question,
    pollOptions: options,
    pollVotes: {},
    createdAt: Date.now(),
  })
}

export async function voteOnPoll(tripId: string, messageId: string, uid: string, optionId: string) {
  await updateDoc(doc(db, 'trips', tripId, 'messages', messageId), {
    [`pollVotes.${uid}`]: optionId,
  })
}

export function subscribeToMessages(tripId: string, callback: (messages: Message[]) => void) {
  // Last 200 messages is plenty for a trip chat — keeps the listener cheap
  const messagesQuery = query(collection(db, 'trips', tripId, 'messages'), orderBy('createdAt', 'asc'), limit(200))

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[]
    callback(messages)
  })
}