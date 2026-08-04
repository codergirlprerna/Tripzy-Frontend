import { useEffect, useRef, useState } from 'react'
import { searchLocation, reverseGeocode, LocationResult } from '@/lib/geocode'

type Props = {
  onSelect: (location: LocationResult) => void
  placeholder?: string
}

export default function LocationPicker({ onSelect, placeholder }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationResult[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 3) {
      setResults([])
      return
    }

    // Debounced so we're not hammering Nominatim's free tier on every keystroke
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const matches = await searchLocation(query)
      setResults(matches)
      setSearching(false)
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function handlePick(location: LocationResult) {
    onSelect(location)
    setQuery(location.displayName)
    setResults([])
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const placeName = (await reverseGeocode(latitude, longitude)) || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`
        handlePick({ displayName: placeName, latitude, longitude })
        setLocating(false)
      },
      () => setLocating(false),
    )
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Search for a city or address'}
          className="w-full rounded-xl border-[2.5px] border-ink px-4 py-3 text-[14.5px] font-medium outline-none"
        />
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="btn-secondary shrink-0 !px-3 !py-2 !text-[12px] disabled:opacity-60"
        >
          {locating ? '…' : '📍 My Location'}
        </button>
      </div>

      {searching && <div className="mt-1 text-[12px] font-medium text-[#4a4460]">Searching…</div>}

      {results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border-[2.5px] border-ink bg-white shadow-hard-sm">
          {results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePick(result)}
              className="block w-full border-b border-ink/10 px-4 py-2.5 text-left text-[13px] font-medium last:border-b-0 hover:bg-paper-dim"
            >
              {result.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}