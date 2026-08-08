import { searchLocation } from '@/lib/geocode'

export type GuidePlace = {
  name: string
  category: string // e.g. "Museum", "Viewpoint", "Cafe" — derived from OSM tags
  distanceKm: number
}

export type TripzyGuide = {
  resolvedName: string
  intro: string | null
  introImageUrl: string | null
  wikiUrl: string | null
  attractions: GuidePlace[]
  food: GuidePlace[]
  placesError: string | null // set if the Overpass call itself failed — distinguishes "genuinely nothing nearby" from "couldn't check"
}

const ATTRACTION_LABELS: Record<string, string> = {
  attraction: 'Attraction',
  museum: 'Museum',
  viewpoint: 'Viewpoint',
  gallery: 'Gallery',
  artwork: 'Landmark',
  zoo: 'Zoo',
  theme_park: 'Theme park',
}

const FOOD_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  fast_food: 'Fast food',
  bar: 'Bar',
  bakery: 'Bakery',
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Several independent public Overpass instances, tried in order. The
// official one (overpass-api.de) is the most commonly used and therefore
// the most rate-limited; the others are community-run mirrors of the same
// OpenStreetMap data. Trying more than one matters because a single shared
// public server being slow, rate-limiting a particular IP, or blocked by a
// specific network/firewall is a real, common failure mode — not a
// hypothetical one — and there's no paid API key that fixes "this one
// server is having a bad day." If ALL of these end up unreliable for your
// network, that's the point to switch to a paid provider (Google Places,
// Foursquare) instead of continuing to patch around free-tier flakiness.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]

/**
 * Overpass is OpenStreetMap's free query API for map data — no key required,
 * but these are shared public servers with no uptime SLA, so this always has
 * to degrade gracefully. Tries each endpoint in OVERPASS_ENDPOINTS in turn,
 * moving on immediately if one times out, errors, or rate-limits.
 */
async function runOverpassQuery(query: string): Promise<{ elements: any[]; error: string | null }> {
  const attemptErrors: string[] = []

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        console.warn(`Overpass endpoint ${endpoint} returned ${response.status}:`, body.slice(0, 300))
        attemptErrors.push(`${endpoint.split('/')[2]}: HTTP ${response.status}`)
        continue // try the next mirror
      }

      const data = await response.json()
      return { elements: data.elements || [], error: null }
    } catch (err: any) {
      const reason = err?.name === 'AbortError' ? 'timed out' : err?.message || 'network error'
      console.warn(`Overpass endpoint ${endpoint} failed:`, reason)
      attemptErrors.push(`${endpoint.split('/')[2]}: ${reason}`)
      continue // try the next mirror
    }
  }

  // Every endpoint failed — genuinely worth surfacing, not just an empty result.
  return { elements: [], error: `All map servers unreachable (${attemptErrors.join('; ')})` }
}

function elementsToPlaces(
  elements: any[],
  labels: Record<string, string>,
  centerLat: number,
  centerLon: number,
): GuidePlace[] {
  return elements
    .filter((el) => el.tags?.name) // skip unnamed nodes/ways — pure noise for a guide
    .map((el) => {
      const tagKey = Object.keys(labels).find((key) => el.tags.tourism === key || el.tags.amenity === key)
      // Nodes carry lat/lon directly; ways (buildings, areas — common for
      // restaurants and larger attractions) only get a computed centroid
      // because we requested `out center` in the query, under el.center.
      const lat = el.lat ?? el.center?.lat
      const lon = el.lon ?? el.center?.lon
      if (lat === undefined || lon === undefined) return null
      return {
        name: el.tags.name as string,
        category: (tagKey && labels[tagKey]) || 'Nearby spot',
        distanceKm: haversineKm(centerLat, centerLon, lat, lon),
      }
    })
    .filter((place): place is GuidePlace => place !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

async function fetchWikiIntro(searchTerm: string): Promise<{ intro: string; imageUrl: string | null; url: string } | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    if (data.type === 'disambiguation' || !data.extract) return null
    return {
      intro: data.extract,
      imageUrl: data.thumbnail?.source ?? null,
      url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`,
    }
  } catch {
    return null
  }
}

/**
 * Builds "Your Tripzy Guide": geocodes the trip's destination to coordinates,
 * then pulls real nearby attractions and food spots around that point from
 * OpenStreetMap, plus a short Wikipedia intro for context. Returns null only
 * if the location itself can't be geocoded at all — a bad/typo'd location is
 * the one case there's nothing useful to show.
 */
export async function fetchTripzyGuide(location: string): Promise<TripzyGuide | null> {
  const searchTerm = location.split(',')[0].trim()
  if (!searchTerm) return null

  const candidates = await searchLocation(location)
  if (candidates.length === 0) return null
  const { latitude, longitude, displayName } = candidates[0]

  const radiusMeters = 6000
  const overpassQuery = `
    [out:json][timeout:20];
    (
      node["tourism"~"attraction|museum|viewpoint|gallery|artwork|zoo|theme_park"](around:${radiusMeters},${latitude},${longitude});
      way["tourism"~"attraction|museum|viewpoint|gallery|artwork|zoo|theme_park"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"~"restaurant|cafe|fast_food|bar|bakery"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"~"restaurant|cafe|fast_food|bar|bakery"](around:${radiusMeters},${latitude},${longitude});
    );
    out center 80;
  `

  const [{ elements, error: placesError }, wiki] = await Promise.all([
    runOverpassQuery(overpassQuery),
    fetchWikiIntro(searchTerm),
  ])

  const attractionElements = elements.filter((el) => el.tags?.tourism)
  const foodElements = elements.filter((el) => el.tags?.amenity)

  return {
    resolvedName: displayName.split(',').slice(0, 2).join(','),
    intro: wiki?.intro ?? null,
    introImageUrl: wiki?.imageUrl ?? null,
    wikiUrl: wiki?.url ?? null,
    attractions: elementsToPlaces(attractionElements, ATTRACTION_LABELS, latitude, longitude).slice(0, 8),
    food: elementsToPlaces(foodElements, FOOD_LABELS, latitude, longitude).slice(0, 8),
    placesError,
  }
}