import { useEffect, useRef, useState, FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { subscribeToMessages, sendTextMessage, sendPollMessage } from '@/lib/chat'
import { Message } from '@/types/message'
import PollBubble from '@/components/PollBubble'

export default function ChatPanel({ tripId }: { tripId: string }) {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [showPollForm, setShowPollForm] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = subscribeToMessages(tripId, setMessages)
    return unsubscribe
  }, [tripId])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || !currentUser) return

    await sendTextMessage({
      tripId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email || 'Someone',
      text: text.trim(),
    })
    setText('')
  }

  async function handleCreatePoll(e: FormEvent) {
    e.preventDefault()
    if (!currentUser || !pollQuestion.trim()) return

    await sendPollMessage({
      tripId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email || 'Someone',
      question: pollQuestion.trim(),
      optionTexts: pollOptions,
    })
    setPollQuestion('')
    setPollOptions(['', ''])
    setShowPollForm(false)
  }

  function updateOption(index: number, value: string) {
    setPollOptions((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  return (
    <div className="flex h-[560px] flex-col rounded-brand border-[2.5px] border-ink bg-white shadow-hard-sm">
      <div className="flex-1 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="py-16 text-center text-[14px] font-medium text-[#4a4460]">
            No messages yet — say hi, or start a poll for tonight's plans.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((message) => {
            const isMine = message.senderId === currentUser?.uid

            return (
              <div key={message.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className="mb-1 font-mono text-[10.5px] font-semibold text-[#a39fb0]">
                  {message.senderName}
                </div>
                {message.type === 'poll' ? (
                  <PollBubble message={message} />
                ) : (
                  <div
                    className={`max-w-[280px] break-words rounded-2xl border-2 border-ink px-4 py-2.5 text-[14px] font-medium ${
                      isMine ? 'bg-pink text-white' : 'bg-paper-dim text-ink'
                    }`}
                  >
                    {message.text}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div ref={scrollRef} />
      </div>

      {showPollForm && (
        <form onSubmit={handleCreatePoll} className="border-t-[2.5px] border-ink bg-paper-dim p-4">
          <input
            type="text"
            required
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="Where should we eat tonight?"
            className="mb-2 w-full rounded-lg border-[2px] border-ink px-3 py-2 text-[13.5px] font-medium outline-none"
          />
          {pollOptions.map((option, i) => (
            <input
              key={i}
              type="text"
              value={option}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="mb-2 w-full rounded-lg border-[2px] border-ink px-3 py-2 text-[13px] font-medium outline-none"
            />
          ))}
          <div className="flex gap-2">
            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={() => setPollOptions((prev) => [...prev, ''])}
                className="btn-secondary !px-3 !py-2 !text-[12px]"
              >
                + Option
              </button>
            )}
            <button type="submit" className="btn-primary !px-4 !py-2 !text-[12.5px]">
              Post poll
            </button>
            <button
              type="button"
              onClick={() => setShowPollForm(false)}
              className="!px-2 !py-2 text-[12.5px] font-semibold text-[#4a4460]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <form onSubmit={handleSend} className="flex gap-2 border-t-[2.5px] border-ink p-4">
        <button
          type="button"
          onClick={() => setShowPollForm((v) => !v)}
          className="btn-secondary shrink-0 !px-3 !py-2.5 !text-[16px]"
          title="Create a poll"
        >
          📊
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the crew…"
          className="w-full rounded-full border-[2.5px] border-ink px-4 py-2.5 text-[14px] font-medium outline-none"
        />
        <button type="submit" className="btn-primary shrink-0 !px-5 !py-2.5 !text-[13.5px]">
          Send
        </button>
      </form>
    </div>
  )
}