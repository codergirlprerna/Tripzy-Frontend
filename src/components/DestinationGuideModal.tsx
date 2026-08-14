import { useEffect, useState } from 'react'
import { fetchTripzyGuide, TripzyGuide, GuidePlace } from '@/lib/destinationGuide'
import { Compass, MapPin, MapPinned, Landmark, UtensilsCrossed, Utensils, LucideIcon } from 'lucide-react'
import { useModalA11y } from '@/hooks/useModalA11y'

type Props = {
  location: string
  onClose: () => void
}

const TABS = ['attractions', 'food'] as const
type Tab = (typeof TABS)[number]

function PlaceRow({ place, icon: Icon }: { place: GuidePlace; icon: LucideIcon }) {
  const distanceLabel = place.distanceKm < 1 ? `${Math.round(place.distanceKm * 1000)} m` : `${place.distanceKm.toFixed(1)} km`
  return (
    <div className="flex items-center gap-3 rounded-xl border-[2px] border-ink/10 px-3.5 py-3">
      <Icon size={17} className="shrink-0 text-ink" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-bold leading-tight">{place.name}</p>
        <p className="mt-0.5 text-[11.5px] font-medium text-[#7a7590]">{place.category}</p>
      </div>
      <span className="shrink-0 font-mono text-[11px] font-semibold text-[#a39fb0]">{distanceLabel}</span>
    </div>
  )
}

export default function DestinationGuideModal({ location, onClose }: Props) {
  const modalRef = useModalA11y(onClose)
  const [guide, setGuide] = useState<TripzyGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<Tab>('attractions')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)

    fetchTripzyGuide(location).then((result) => {
      if (cancelled) return
      if (!result) {
        setNotFound(true)
      } else {
        setGuide(result)
        setTab(result.attractions.length > 0 ? 'attractions' : 'food')
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [location])

  const activePlaces = guide ? (tab === 'attractions' ? guide.attractions : guide.food) : []

  return (
    <div className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4 py-8">
      <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Your Tripzy Guide" tabIndex={-1} className="modal-card sticker-card flex max-h-[85vh] w-full max-w-[480px] flex-col overflow-hidden shadow-hard">
        <div className="flex items-start justify-between gap-4 border-b-[2px] border-dashed border-ink/15 p-6 pb-4">
          <div>
            <h2 className="flex items-center gap-2 font-display text-[20px] font-extrabold">
              <Compass size={19} /> Your Tripzy Guide
            </h2>
            <p className="mt-0.5 flex items-center gap-1 text-[12.5px] font-medium text-[#7a7590]">
              <MapPin size={12} /> {location}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2px] border-ink text-[16px] font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-ink border-t-transparent" />
              <p className="text-[14px] font-medium text-[#4a4460]">Scouting {location.split(',')[0]}…</p>
              <p className="text-[11.5px] font-medium text-[#a39fb0]">
                Checking map data — this can take a few seconds.
              </p>
            </div>
          ) : notFound || !guide ? (
            <div className="py-10 text-center">
              <div className="mb-3 flex justify-center text-[#a39fb0]"><MapPinned size={32} /></div>
              <p className="text-[14px] font-semibold">Couldn't place this destination.</p>
              <p className="mt-1 text-[12.5px] font-medium text-[#7a7590]">
                Try a more specific location on the trip (e.g. "Lisbon, Portugal" instead of just a country).
              </p>
            </div>
          ) : (
            <>
              {guide.knownFor && (
                <div className="mb-4 rounded-xl border-[2px] border-ink bg-lime/40 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">Known for</p>
                  <p className="mt-0.5 text-[14px] font-bold text-ink">{guide.knownFor}</p>
                </div>
              )}

              {guide.intro && (
                <div className="mb-5">
                  {guide.introImageUrl && (
                    <img
                      src={guide.introImageUrl}
                      alt={guide.resolvedName}
                      className="mb-3 h-[150px] w-full rounded-xl border-[2.5px] border-ink object-cover"
                    />
                  )}
                  <p className="text-[13.5px] font-medium leading-relaxed text-[#4a4460]">{guide.intro}</p>
                  {guide.wikiUrl && (
                    <a
                      href={guide.wikiUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block font-mono text-[11px] font-semibold text-[#4a4460] underline"
                    >
                      Read more →
                    </a>
                  )}
                </div>
              )}

              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setTab('attractions')}
                  className={`inline-flex items-center gap-1.5 rounded-full border-[2px] border-ink px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                    tab === 'attractions' ? 'bg-ink text-white' : 'bg-white text-ink'
                  }`}
                >
                  <Landmark size={14} /> Attractions ({guide.attractions.length})
                </button>
                <button
                  onClick={() => setTab('food')}
                  className={`inline-flex items-center gap-1.5 rounded-full border-[2px] border-ink px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                    tab === 'food' ? 'bg-ink text-white' : 'bg-white text-ink'
                  }`}
                >
                  <UtensilsCrossed size={14} /> Food ({guide.food.length})
                </button>
              </div>

              {activePlaces.length === 0 ? (
                <p className="py-8 text-center text-[13px] font-medium text-[#7a7590]">
                  {guide.placesError
                    ? guide.placesError.includes('VITE_GEOAPIFY_API_KEY')
                      ? "This needs a free Geoapify API key to look up nearby places — sign up at geoapify.com and add VITE_GEOAPIFY_API_KEY to .env."
                      : `Couldn't check nearby spots right now (${guide.placesError}). Try again in a moment.`
                    : `No ${tab === 'attractions' ? 'attractions' : 'food spots'} found nearby for this area yet.`}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {activePlaces.map((place, i) => (
                    <PlaceRow key={`${place.name}-${i}`} place={place} icon={tab === 'attractions' ? MapPin : Utensils} />
                  ))}
                </div>
              )}

              <p className="mt-5 border-t-[2px] border-dashed border-ink/15 pt-3 font-mono text-[10.5px] font-semibold text-[#a39fb0]">
                Pulled from Geoapify — distances are straight-line from {guide.resolvedName}, not walking
                routes.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}