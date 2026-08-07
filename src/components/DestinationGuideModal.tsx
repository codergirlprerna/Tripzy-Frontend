import { useEffect, useState } from 'react'
import { fetchDestinationGuide, DestinationGuide } from '@/lib/destinationGuide'

type Props = {
  location: string
  onClose: () => void
}

export default function DestinationGuideModal({ location, onClose }: Props) {
  const [guide, setGuide] = useState<DestinationGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)

    fetchDestinationGuide(location).then((result) => {
      if (cancelled) return
      if (!result) {
        setNotFound(true)
      } else {
        setGuide(result)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [location])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4 py-8">
      <div className="sticker-card max-h-[85vh] w-full max-w-[480px] overflow-y-auto p-7 shadow-hard">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[20px] font-extrabold">Destination guide</h2>
            <p className="mt-0.5 text-[12.5px] font-medium text-[#7a7590]">📍 {location}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2px] border-ink text-[16px] font-bold"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="py-14 text-center text-[14px] font-medium text-[#4a4460]">Looking up {location}…</div>
        ) : notFound || !guide ? (
          <div className="py-10 text-center">
            <div className="mb-3 text-[28px]">🗺️</div>
            <p className="text-[14px] font-semibold">No guide found for this destination yet.</p>
            <p className="mt-1 text-[12.5px] font-medium text-[#7a7590]">
              This looks up a Wikipedia summary by place name — it works best for cities, regions, and well-known
              landmarks.
            </p>
          </div>
        ) : (
          <div>
            {guide.thumbnailUrl && (
              <img
                src={guide.thumbnailUrl}
                alt={guide.title}
                className="mb-4 h-[180px] w-full rounded-xl border-[2.5px] border-ink object-cover"
              />
            )}
            <h3 className="mb-2 font-display text-[17px] font-extrabold">{guide.title}</h3>
            <p className="text-[13.5px] font-medium leading-relaxed text-[#4a4460]">{guide.extract}</p>
            <a
              href={guide.pageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block font-mono text-[11.5px] font-semibold text-[#4a4460] underline"
            >
              Read more on Wikipedia →
            </a>
            <p className="mt-5 border-t-[2px] border-dashed border-ink/20 pt-3 font-mono text-[10.5px] font-semibold text-[#a39fb0]">
              General background, not live listings — for restaurant/activity recommendations, pair this with a
              places API later.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}