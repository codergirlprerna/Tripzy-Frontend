import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Entry } from '@/types/entry'
import { searchLocation } from '@/lib/geocode'
import { fetchRoute } from '@/lib/routing'
import DestinationGuideModal from '@/components/DestinationGuideModal'
import { Compass, Navigation, MapPin, Plane, Car } from 'lucide-react'

type Props = {
  entries: Entry[]
}

type MapStyle = 'street' | 'satellite'

const TILE_LAYERS: Record<MapStyle, { url: string; attribution: string; maxZoom: number }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  },
  // Esri's World Imagery — free to use without an API key for this kind of
  // low-volume, non-commercial-scale usage (same spirit as OSM/Nominatim
  // elsewhere in this app). If Tripzy ever gets heavy real traffic, this is
  // the one to swap for a paid tile provider with an actual usage SLA.
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery © Esri',
    maxZoom: 19,
  },
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

function buildUserLocationIcon() {
  return L.divIcon({
    className: 'tripzy-user-pin',
    html: `
      <div style="
        width: 20px; height: 20px; border-radius: 50%;
        border: 3px solid #fff; background: #6ee7ff;
        box-shadow: 0 0 0 2px #161221, 0 2px 6px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

/** Deep links that hand off to the real Maps app — no API key needed, these are just URLs. */
function directionsPopupHtml(lat: number, lon: number, title: string, dateLabel: string, mediaUrl?: string) {
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
  const appleUrl = `https://maps.apple.com/?daddr=${lat},${lon}`
  return `
    <div style="font-family: Inter, sans-serif; min-width:160px;">
      ${mediaUrl ? `<img src="${mediaUrl}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />` : ''}
      <div style="font-weight:700;font-size:12.5px;">${title}</div>
      ${dateLabel ? `<div style="font-size:11px;color:#777;margin-bottom:6px;">${dateLabel}</div>` : ''}
      <div style="display:flex;gap:6px;margin-top:6px;">
        <a href="${googleUrl}" target="_blank" rel="noreferrer" style="flex:1;text-align:center;font-size:11px;font-weight:700;padding:6px 8px;border-radius:999px;border:2px solid #161221;background:#161221;color:#fff;text-decoration:none;">Directions</a>
        <a href="${appleUrl}" target="_blank" rel="noreferrer" style="flex:1;text-align:center;font-size:11px;font-weight:700;padding:6px 8px;border-radius:999px;border:2px solid #161221;background:#fff;color:#161221;text-decoration:none;">Apple Maps</a>
      </div>
    </div>
  `
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hrs = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
}

export default function TripMap({ entries }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const searchMarkerRef = useRef<L.Marker | null>(null)
  const directionsLayerRef = useRef<(L.Polyline | L.Marker)[]>([])

  const [mapStyle, setMapStyle] = useState<MapStyle>('street')
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [lastSearchedPlace, setLastSearchedPlace] = useState<string | null>(null)

  const [showDirections, setShowDirections] = useState(false)
  const [fromQuery, setFromQuery] = useState('')
  const [toQuery, setToQuery] = useState('')
  const [directionsLoading, setDirectionsLoading] = useState(false)
  const [directionsError, setDirectionsError] = useState('')
  const [directionsInfo, setDirectionsInfo] = useState<{ distanceKm: number; durationMin: number; destLat: number; destLon: number; destName: string } | null>(null)
  const [guideLocation, setGuideLocation] = useState<string | null>(null)

  const locatedEntries = entries
    .filter((e) => typeof e.latitude === 'number' && typeof e.longitude === 'number')
    .sort((a, b) => (a.capturedAt || 0) - (b.capturedAt || 0))

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, { scrollWheelZoom: false }).setView([20, 0], 2)
    const tileLayer = L.tileLayer(TILE_LAYERS.street.url, {
      attribution: TILE_LAYERS.street.attribution,
      maxZoom: TILE_LAYERS.street.maxZoom,
    }).addTo(map)
    tileLayerRef.current = tileLayer
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Swap tile layer when the street/satellite toggle changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !tileLayerRef.current) return
    map.removeLayer(tileLayerRef.current)
    const config = TILE_LAYERS[mapStyle]
    const newLayer = L.tileLayer(config.url, { attribution: config.attribution, maxZoom: config.maxZoom }).addTo(map)
    tileLayerRef.current = newLayer
  }, [mapStyle])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        if (layer === userMarkerRef.current || layer === searchMarkerRef.current) return
        if (directionsLayerRef.current.includes(layer as any)) return
        map.removeLayer(layer)
      }
    })

    if (locatedEntries.length === 0) return

    const points: [number, number][] = locatedEntries.map((e) => [e.latitude!, e.longitude!])
    let cancelled = false
    let routeLine: L.Polyline | null = null

    async function drawTripRoute() {
      // A real routed path along roads when possible — falls back to the
      // straight dashed line if OSRM's free demo server is unavailable or
      // the points are too far apart to route sensibly (e.g. different
      // continents), so the map never ends up with nothing connecting the
      // stops just because routing failed.
      const route = points.length >= 2 ? await fetchRoute(points) : null
      if (cancelled || !map) return

      if (route) {
        routeLine = L.polyline(route.points, { color: '#ff6ec7', weight: 4, opacity: 0.85 }).addTo(map)
      } else {
        routeLine = L.polyline(points, { color: '#ff6ec7', weight: 3, dashArray: '6 8', opacity: 0.85 }).addTo(map)
      }
    }
    drawTripRoute()

    locatedEntries.forEach((entry) => {
      const marker = L.marker([entry.latitude!, entry.longitude!], {
        icon: buildPhotoPinIcon(entry.mediaUrl),
      }).addTo(map)

      const dateLabel = entry.capturedAt ? new Date(entry.capturedAt).toLocaleDateString() : ''
      marker.bindPopup(
        directionsPopupHtml(entry.latitude!, entry.longitude!, entry.locationName || 'Unknown location', dateLabel, entry.mediaUrl),
      )
    })

    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })

    return () => {
      cancelled = true
      if (routeLine) map.removeLayer(routeLine)
    }
  }, [locatedEntries])

  function handleFlyover() {
    const map = mapRef.current
    if (!map || locatedEntries.length === 0) return

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

  function handleLocateMe() {
    const map = mapRef.current
    if (!map) return
    if (!navigator.geolocation) {
      setLocateError('Location not supported on this device/browser.')
      return
    }

    setLocating(true)
    setLocateError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current)
        const marker = L.marker([latitude, longitude], { icon: buildUserLocationIcon() })
          .addTo(map)
          .bindPopup('<div style="font-family: Inter, sans-serif; font-size:12.5px; font-weight:700;">You are here</div>')
        userMarkerRef.current = marker
        map.flyTo([latitude, longitude], 13, { duration: 1.2 })
        setLocating(false)
      },
      (err) => {
        setLocateError(err.code === err.PERMISSION_DENIED ? 'Location permission denied.' : 'Could not get your location.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const map = mapRef.current
    if (!map || !searchQuery.trim()) return

    setSearching(true)
    setSearchError('')
    try {
      const results = await searchLocation(searchQuery)
      if (results.length === 0) {
        setSearchError('No matching place found.')
        setLastSearchedPlace(null)
        return
      }
      const { latitude, longitude, displayName } = results[0]
      if (searchMarkerRef.current) map.removeLayer(searchMarkerRef.current)
      const marker = L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(directionsPopupHtml(latitude, longitude, displayName, ''))
        .openPopup()
      searchMarkerRef.current = marker
      map.flyTo([latitude, longitude], 13, { duration: 1.2 })
      setLastSearchedPlace(displayName)
    } catch {
      setSearchError('Search failed — try again.')
    } finally {
      setSearching(false)
    }
  }

  function clearDirections() {
    const map = mapRef.current
    if (map) directionsLayerRef.current.forEach((layer) => map.removeLayer(layer))
    directionsLayerRef.current = []
    setDirectionsInfo(null)
    setDirectionsError('')
  }

  async function handleGetDirections(e: React.FormEvent) {
    e.preventDefault()
    const map = mapRef.current
    if (!map || !fromQuery.trim() || !toQuery.trim()) return

    setDirectionsLoading(true)
    setDirectionsError('')
    clearDirections()

    try {
      const [fromResults, toResults] = await Promise.all([searchLocation(fromQuery), searchLocation(toQuery)])
      if (fromResults.length === 0 || toResults.length === 0) {
        setDirectionsError(fromResults.length === 0 ? `Couldn't find "${fromQuery}".` : `Couldn't find "${toQuery}".`)
        return
      }

      const from = fromResults[0]
      const to = toResults[0]
      const route = await fetchRoute([[from.latitude, from.longitude], [to.latitude, to.longitude]])

      const newLayers: (L.Polyline | L.Marker)[] = []

      if (route) {
        const line = L.polyline(route.points, { color: '#161221', weight: 5, opacity: 0.9 }).addTo(map)
        newLayers.push(line)
        map.fitBounds(line.getBounds(), { padding: [60, 60] })
      } else {
        // Routing failed (or the two places are unreasonably far apart for
        // the chosen profile, e.g. walking between countries) — still show
        // where both points are, just without a drawn path between them.
        const line = L.polyline(
          [[from.latitude, from.longitude], [to.latitude, to.longitude]],
          { color: '#161221', weight: 3, dashArray: '4 8', opacity: 0.6 },
        ).addTo(map)
        newLayers.push(line)
        map.fitBounds(line.getBounds(), { padding: [60, 60] })
      }

      const startMarker = L.marker([from.latitude, from.longitude])
        .addTo(map)
        .bindPopup(`<div style="font-family: Inter, sans-serif; font-size:12.5px; font-weight:700;">${from.displayName}</div>`)
      const endMarker = L.marker([to.latitude, to.longitude])
        .addTo(map)
        .bindPopup(directionsPopupHtml(to.latitude, to.longitude, to.displayName, ''))
      newLayers.push(startMarker, endMarker)

      directionsLayerRef.current = newLayers

      if (route) {
        setDirectionsInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, destLat: to.latitude, destLon: to.longitude, destName: to.displayName })
      } else {
        setDirectionsError("Couldn't compute a route between these — showing both points on the map instead.")
      }
    } catch {
      setDirectionsError('Something went wrong getting directions. Try again.')
    } finally {
      setDirectionsLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-3 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search a place or address…"
          className="flex-1 rounded-full border-2 border-ink px-4 py-2 text-[13px] font-medium outline-none"
        />
        <button
          type="submit"
          disabled={searching}
          className="btn-secondary !px-4 !py-2 !text-[13px] disabled:opacity-60"
        >
          {searching ? '…' : 'Search'}
        </button>
      </form>
      {searchError && <p className="mb-2 text-[11.5px] font-semibold text-[#c0325f]">{searchError}</p>}
      {lastSearchedPlace && !searchError && (
        <button
          onClick={() => setGuideLocation(lastSearchedPlace)}
          className="mb-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-[#4a4460] underline"
        >
          <Compass size={12} /> See nearby attractions & food here
        </button>
      )}

      <button
        onClick={() => setShowDirections(!showDirections)}
        className="mb-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-[#4a4460] underline"
      >
        {showDirections ? (
          'Hide directions'
        ) : (
          <>
            <Navigation size={13} /> Get directions between two places
          </>
        )}
      </button>

      {showDirections && (
        <form onSubmit={handleGetDirections} className="mb-4 rounded-2xl border-2 border-ink bg-paper-dim p-4">
          <div className="flex flex-col gap-2.5">
            <input
              type="text"
              value={fromQuery}
              onChange={(e) => setFromQuery(e.target.value)}
              placeholder="From…"
              className="rounded-full border-2 border-ink bg-white px-4 py-2 text-[13px] font-medium outline-none"
            />
            <input
              type="text"
              value={toQuery}
              onChange={(e) => setToQuery(e.target.value)}
              placeholder="To…"
              className="rounded-full border-2 border-ink bg-white px-4 py-2 text-[13px] font-medium outline-none"
            />
            <p className="font-mono text-[10px] font-semibold text-[#a39fb0]">
              Driving directions only — the free routing service used here doesn't have real walking/cycling data,
              so those aren't offered rather than show wrong numbers.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={directionsLoading}
                className="btn-primary inline-flex flex-1 items-center justify-center gap-1.5 !py-2 !text-[13px] disabled:opacity-60"
              >
                {directionsLoading ? (
                  'Routing…'
                ) : (
                  <>
                    <Car size={14} /> Get route
                  </>
                )}
              </button>
            </div>
          </div>

          {directionsError && <p className="mt-3 text-[12px] font-semibold text-[#c0325f]">{directionsError}</p>}

          {directionsInfo && (
            <div className="mt-3 rounded-xl border-2 border-ink bg-white px-3.5 py-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[13.5px]">{directionsInfo.distanceKm.toFixed(1)} km</span>
                  <span className="mx-1.5 text-[#a39fb0]">·</span>
                  <span className="text-[13px] font-medium text-[#4a4460]">~{formatDuration(directionsInfo.durationMin)}</span>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${directionsInfo.destLat},${directionsInfo.destLon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border-2 border-ink bg-ink px-3 py-1.5 text-[11.5px] font-bold text-white"
                >
                  Open in Google Maps
                </a>
              </div>
              <p className="mt-1.5 font-mono text-[10px] font-semibold text-[#a39fb0]">
                Estimate only — no live traffic data. Open in Google Maps above for a real-time ETA.
              </p>
              <button
                onClick={() => setGuideLocation(directionsInfo.destName)}
                className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-[#4a4460] underline"
              >
                <Compass size={12} /> See nearby attractions & food at this destination
              </button>
            </div>
          )}
        </form>
      )}

      {guideLocation && <DestinationGuideModal location={guideLocation} onClose={() => setGuideLocation(null)} />}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono text-[11px] font-semibold text-[#7a7590]">
          {locatedEntries.length} of {entries.length} photos have location data
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex overflow-hidden rounded-full border-2 border-ink">
            <button
              onClick={() => setMapStyle('street')}
              className={`px-3 py-1.5 text-[12px] font-bold ${mapStyle === 'street' ? 'bg-ink text-white' : 'bg-white text-ink'}`}
            >
              Street
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-3 py-1.5 text-[12px] font-bold ${mapStyle === 'satellite' ? 'bg-ink text-white' : 'bg-white text-ink'}`}
            >
              Satellite
            </button>
          </div>
          <button onClick={handleLocateMe} disabled={locating} className="btn-secondary inline-flex items-center gap-1 !px-4 !py-1.5 !text-[12px] disabled:opacity-60">
            {locating ? (
              'Locating…'
            ) : (
              <>
                <MapPin size={13} /> Locate me
              </>
            )}
          </button>
          <button
            onClick={handleFlyover}
            disabled={locatedEntries.length === 0}
            className="btn-secondary inline-flex items-center gap-1 !px-4 !py-1.5 !text-[12px] disabled:opacity-50"
          >
            <Plane size={13} /> Fly through route
          </button>
        </div>
      </div>
      {locateError && <p className="mb-2 text-[11.5px] font-semibold text-[#c0325f]">{locateError}</p>}

      <div
        ref={mapContainerRef}
        className="h-[420px] w-full overflow-hidden rounded-2xl border-[2.5px] border-ink shadow-hard-sm"
      />
      {locatedEntries.length === 0 && (
        <p className="mt-3 text-center text-[13px] font-medium text-[#4a4460]">
          No photos with location data yet — photos with GPS info will show up here automatically. Search for a
          place above or tap "Locate me" to explore the map in the meantime.
        </p>
      )}
    </div>
  )
}