import { Entry } from '@/types/entry'
import { Mic } from 'lucide-react'

function formatDate(timestamp: number | null) {
  if (!timestamp) return 'Date unknown'
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function VoiceEntryCard({ entry }: { entry: Entry }) {
  return (
    <div className="sticker-card p-4 shadow-hard-sm">
      <div className="mb-2 flex items-center gap-2">
        <Mic size={16} />
        <span className="font-mono text-[11px] font-semibold text-[#7a7590]">{formatDate(entry.capturedAt)}</span>
      </div>
      {entry.mediaUrl && <audio src={entry.mediaUrl} controls className="w-full" />}
      {entry.transcript && (
        <p className="mt-2 text-[12.5px] font-medium italic text-[#4a4460]">"{entry.transcript}"</p>
      )}
      <div className="mt-2 text-[11px] font-semibold text-[#a39fb0]">Added by {entry.createdByName}</div>
    </div>
  )
}