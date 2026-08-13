import { useState } from 'react'
import { Entry } from '@/types/entry'
import { setEntryLocation } from '@/lib/entries'
import LocationPicker from '@/components/LocationPicker'
import { LocationResult } from '@/lib/geocode'
import { MapPin } from 'lucide-react'

function formatDate(timestamp: number | null) {
  if (!timestamp) return 'Date unknown'
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function EntryCard({ entry }: { entry: Entry }) {
  const [addingLocation, setAddingLocation] = useState(false)
  const hasLocation = typeof entry.latitude === 'number' && typeof entry.longitude === 'number'

  async function handlePickLocation(result: LocationResult) {
    await setEntryLocation(entry.tripId, entry.id, result.latitude, result.longitude, result.displayName)
    setAddingLocation(false)
  }

  return (
    <div className="sticker-card overflow-hidden shadow-hard-sm">
      {entry.mediaUrl && (
        <img src={entry.mediaUrl} alt={entry.caption || 'Trip photo'} className="h-[200px] w-full object-cover" />
      )}
      <div className="p-4">
        <div className="font-mono text-[11px] font-semibold text-[#7a7590]">{formatDate(entry.capturedAt)}</div>

        {entry.locationName ? (
          <div className="mt-1 flex items-center gap-1 text-[12.5px] font-medium text-[#4a4460]">
            <MapPin size={12} className="shrink-0" /> {entry.locationName}
          </div>
        ) : hasLocation ? (
          <div className="mt-1 flex items-center gap-1 text-[12.5px] font-medium text-[#4a4460]">
            <MapPin size={12} className="shrink-0" /> {entry.latitude!.toFixed(3)}, {entry.longitude!.toFixed(3)}
          </div>
        ) : addingLocation ? (
          <div className="mt-2">
            <LocationPicker placeholder="Add a location" onSelect={handlePickLocation} />
          </div>
        ) : (
          <button
            onClick={() => setAddingLocation(true)}
            className="mt-1 text-[12.5px] font-semibold text-pink underline"
          >
            + Add location
          </button>
        )}

        <div className="mt-1 text-[11px] font-semibold text-[#a39fb0]">Added by {entry.createdByName}</div>
      </div>
    </div>
  )
}