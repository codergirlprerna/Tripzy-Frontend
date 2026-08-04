import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Entry } from '@/types/entry'

type Props = {
  entries: Entry[]
}

function buildPhotoPinIcon(mediaUrl: string | undefined) {
  return L.divIcon({
    className: 'tripzy-map-pin',
    html: `
      <div style="
        width: 48px; height: 48px; border-radius: 12px;
        border: 2.5px solid #161221; overflow: hidden;
        box-shadow: 3px 3px 0 #161221; background: #fff;
      ">
        ${mediaUrl ? `<img src="${mediaUrl}" style="width:100%;height:100%;object-fit:cover;" />` : ''}
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
  })
}

export default function TripMap({ entries }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  const locatedEntries = entries
    .filter((e) => typeof e.latitude === 'number' && typeof e.longitude === 'number')
    .sort((a, b) => (a.capturedAt || 0) - (b.capturedAt || 0))

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, { scrollWheelZoom: false }).setView([20, 0], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear previous markers/lines before redrawing (keeps this in sync with live entry updates)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer)
      }
    })

    if (locatedEntries.length === 0) return

    const points: [number, number][] = locatedEntries.map((e) => [e.latitude!, e.longitude!])

    // The connecting route line — Polarsteps' signature visual, borrowed and restyled in Tripzy's palette
    L.polyline(points, { color: '#ff6ec7', weight: 3, dashArray: '6 8', opacity: 0.85 }).addTo(map)

    locatedEntries.forEach((entry) => {
      const marker = L.marker([entry.latitude!, entry.longitude!], {
        icon: buildPhotoPinIcon(entry.mediaUrl),
      }).addTo(map)

      const dateLabel = entry.capturedAt ? new Date(entry.capturedAt).toLocaleDateString() : ''
      marker.bindPopup(
        `<div style="font-family: Inter, sans-serif; min-width:140px;">
          ${entry.mediaUrl ? `<img src="${entry.mediaUrl}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />` : ''}
          <div style="font-weight:700;font-size:12.5px;">${entry.locationName || 'Unknown location'}</div>
          <div style="font-size:11px;color:#777;">${dateLabel}</div>
        </div>`,
      )
    })

    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
  }, [locatedEntries])

  function handleFlyover() {
    const map = mapRef.current
    if (!map || locatedEntries.length === 0) return

    // Lightweight take on FindPenguins' flyover video — flies the camera through each
    // pinned stop in chronological order rather than rendering an actual exportable video.
    let i = 0
    const step = () => {
      if (i >= locatedEntries.length) return
      const entry = locatedEntries[i]
      map.flyTo([entry.latitude!, entry.longitude!], 10, { duration: 1.4 })
      i++
      setTimeout(step, 1700)
    }
    step()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="font-mono text-[11px] font-semibold text-[#7a7590]">
          {locatedEntries.length} of {entries.length} photos have location data
        </div>
        <button
          onClick={handleFlyover}
          disabled={locatedEntries.length === 0}
          className="btn-secondary !px-4 !py-2 !text-[13px] disabled:opacity-50"
        >
          ✈️ Fly through route
        </button>
      </div>
      <div
        ref={mapContainerRef}
        className="h-[420px] w-full overflow-hidden rounded-brand border-[2.5px] border-ink shadow-hard-sm"
      />
      {locatedEntries.length === 0 && (
        <p className="mt-3 text-center text-[13px] font-medium text-[#4a4460]">
          No photos with location data yet — photos with GPS info will show up here automatically.
        </p>
      )}
    </div>
  )
}