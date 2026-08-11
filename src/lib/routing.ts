export type TravelProfile = 'driving' | 'walking' | 'cycling'

export type RouteResult = {
  points: [number, number][] // [lat, lon] pairs, ready for Leaflet
  distanceKm: number
  durationMin: number
}

/**
 * OSRM (Open Source Routing Machine) — the OSM ecosystem's free routing
 * engine, same spirit as Nominatim (geocoding) and the map tiles already
 * used elsewhere in this app. router.project-osrm.org is OSRM's public
 * DEMO server: free, no API key, but shared and with no uptime guarantee —
 * worth knowing given Overpass's public servers turned out to be
 * unreliable earlier this session. Unlike Overpass, this only needs ONE
 * request (no mirror fan-out needed) and fails fast with a clear error
 * rather than hanging, but if it turns out to be flaky in practice, the
 * fix is a paid routing provider (Mapbox Directions, Google Directions),
 * not more retry logic.
 *
 * `waypoints` is [lat, lon] pairs in visit order — 2 points for simple A→B,
 * more for a multi-stop route through all of them in sequence.
 */
export async function fetchRoute(
  waypoints: [number, number][],
  profile: TravelProfile = 'driving',
): Promise<RouteResult | null> {
  if (waypoints.length < 2) return null

  // OSRM wants lon,lat (reversed from how this app stores lat,lon everywhere else).
  const coordsParam = waypoints.map(([lat, lon]) => `${lon},${lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsParam}?overview=full&geometries=geojson`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      console.warn('OSRM routing failed:', response.status)
      return null
    }

    const data = await response.json()
    const route = data.routes?.[0]
    if (!route?.geometry?.coordinates) return null

    return {
      points: route.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    }
  } catch (err: any) {
    console.warn('OSRM routing error:', err?.name === 'AbortError' ? 'timed out' : err?.message)
    return null
  }
}