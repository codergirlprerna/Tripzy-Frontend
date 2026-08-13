import { useState } from 'react'
import { Message } from '@/types/message'
import { voteOnPoll } from '@/lib/chat'
import { useAuth } from '@/context/AuthContext'
import Spinner from '@/components/Spinner'
import { Check } from 'lucide-react'

export default function PollBubble({ message }: { message: Message }) {
  const { currentUser } = useAuth()
  const [votingFor, setVotingFor] = useState<string | null>(null)
  const votes = message.pollVotes || {}
  const options = message.pollOptions || []
  const totalVotes = Object.keys(votes).length
  const myVote = currentUser ? votes[currentUser.uid] : undefined

  async function handleVote(optionId: string) {
    if (!currentUser || votingFor) return
    setVotingFor(optionId)
    try {
      await voteOnPoll(message.tripId, message.id, currentUser.uid, optionId)
    } finally {
      setVotingFor(null)
    }
  }

  return (
    <div className="sticker-card max-w-[320px] p-4 shadow-hard-sm">
      <div className="mb-1 font-mono text-[10.5px] font-bold uppercase tracking-wide text-pink">POLL</div>
      <div className="mb-3 font-display text-[15px] font-extrabold">{message.pollQuestion}</div>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const optionVotes = Object.values(votes).filter((v) => v === option.id).length
          const pct = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0
          const isMine = myVote === option.id

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={votingFor !== null}
              className={`relative overflow-hidden rounded-lg border-2 border-ink px-3 py-2 text-left text-[13px] font-semibold transition-colors disabled:cursor-wait ${
                isMine ? 'bg-lime' : 'bg-white hover:bg-paper-dim'
              }`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-pink/25 transition-all"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  {votingFor === option.id ? <Spinner size={12} /> : isMine && <Check size={13} />}
                  {option.text}
                </span>
                <span className="font-mono text-[11px] text-[#7a7590]">{pct}%</span>
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-2 font-mono text-[10.5px] text-[#a39fb0]">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
      </div>
    </div>
  )
}