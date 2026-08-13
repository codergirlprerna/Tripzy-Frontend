import { useEffect, useState } from 'react'
import { Sparkles, RotateCw, Copy, Check } from 'lucide-react'
import { Trip } from '@/types/trip'
import { Entry } from '@/types/entry'
import { generateTripStory } from '@/lib/aiStory'

type Props = {
  trip: Trip
  entries: Entry[]
  onClose: () => void
}

export default function AIStoryModal({ trip, entries, onClose }: Props) {
  const [story, setStory] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  async function runGenerate() {
    setLoading(true)
    setCopied(false)
    const result = await generateTripStory(trip, entries)
    setStory(result)
    setLoading(false)
  }

  useEffect(() => {
    runGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCopy() {
    navigator.clipboard.writeText(story)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4 py-8">
      <div className="sticker-card max-h-[85vh] w-full max-w-[480px] overflow-y-auto p-7 shadow-hard">
        <div className="mb-1 flex items-start justify-between gap-4">
          <h2 className="flex items-center gap-2 font-display text-[20px] font-extrabold">
            <Sparkles size={19} /> AI trip story
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2px] border-ink text-[16px] font-bold"
          >
            ×
          </button>
        </div>
        <p className="mb-5 font-mono text-[10.5px] font-semibold text-[#a39fb0]">
          Early preview — generated from this trip's entries, not a live model yet.
        </p>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-ink border-t-transparent" />
            <p className="text-[14px] font-medium text-[#4a4460]">Writing the story…</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border-[2.5px] border-ink bg-paper-dim p-5">
              <p className="text-[14px] font-medium leading-relaxed text-ink">{story}</p>
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={runGenerate} className="btn-secondary inline-flex items-center gap-1.5 !px-4 !py-2.5 !text-[13px]">
                <RotateCw size={14} /> Regenerate
              </button>
              <button onClick={handleCopy} className="btn-secondary inline-flex items-center gap-1.5 !px-4 !py-2.5 !text-[13px]">
                {copied ? (
                  <>
                    <Check size={14} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}