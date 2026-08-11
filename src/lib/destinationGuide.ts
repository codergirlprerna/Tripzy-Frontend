import { searchLocation } from '@/lib/geocode'

export type GuidePlace = {
  name: string
  category: string
  distanceKm: number
}

export type TripzyGuide = {
  resolvedName: string
  intro: string | null
  introImageUrl: string | null
  wikiUrl: string | null
  knownFor: string | null
  attractions: GuidePlace[]
  food: GuidePlace[]
  placesError: string | null // set if the places lookup itself failed — distinguishes "genuinely nothing nearby" from "couldn't check"
}

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY

// Geoapify's category taxonomy, mapped to a short display label. Full list:
// https://apidocs.geoapify.com/docs/places/#categories
const CATEGORY_LABELS: Record<string, string> = {
  'tourism.sights': 'Sight',
  'tourism.attraction': 'Attraction',
  'entertainment.museum': 'Museum',
  'natural': 'Natural landmark',
  'religion': 'Religious site',
  'catering.restaurant': 'Restaurant',
  'catering.cafe': 'Cafe',
  'catering.fast_food': 'Fast food',
  'catering.bar': 'Bar',
  'catering.pub': 'Pub',
}

// Deliberately NOT requesting the bare "tourism" or "catering" parent
// categories anymore — that was pulling in hotels, lodging, and tourist
// info points (anything under the huge "tourism" umbrella) mixed in with
// genuine attractions, which is why junk entries like plain numbers
// ("2624", "3230" — almost certainly unnamed accommodation/address points)
// were showing up. Naming the specific subcategories keeps results
// actually meaningful.
const ATTRACTION_CATEGORIES = ['tourism.sights', 'tourism.attraction', 'entertainment.museum', 'natural', 'religion']
const FOOD_CATEGORIES = ['catering.restaurant', 'catering.cafe', 'catering.fast_food', 'catering.bar', 'catering.pub']

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Geoapify's Places API. Unlike Overpass, this is a normal commercial API
 * with a real SLA — free tier is 3,000 requests/day, no credit card needed,
 * sign up at https://myprojects.geoapify.com. Switched to this after every
 * public Overpass mirror consistently timed out end-to-end on repeated
 * testing — that pattern (3 independent servers, same result, every time)
 * means something on the network path is blocking that traffic, which no
 * amount of retrying or adding more mirrors fixes. A keyed API isn't a
 * downgrade here — it's what actually routes reliably.
 *
 * Requires VITE_GEOAPIFY_API_KEY in .env. Without it, this throws rather
 * than silently returning nothing, so the failure is loud, not mysterious.
 *
 * Takes an explicit category list rather than one shared combined request —
 * a single request mixing broad categories (tourism has MANY more tagged
 * points than catering does in most cities) meant tourism results could
 * fill the entire `limit` before any food results were even considered,
 * effectively starving food out of the response regardless of how much
 * real food data existed. Two separate requests, each with their own
 * dedicated limit, guarantees food gets its own quota.
 */
async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  radiusMeters: number,
  categories: string[],
  limit: number,
): Promise<{ elements: any[]; error: string | null }> {
  if (!GEOAPIFY_API_KEY) {
    return { elements: [], error: 'VITE_GEOAPIFY_API_KEY is not set — see .env.example' }
  }

  const url =
    `https://api.geoapify.com/v2/places?categories=${categories.join(',')}` +
    `&filter=circle:${lon},${lat},${radiusMeters}` +
    `&bias=proximity:${lon},${lat}` +
    `&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.warn('Geoapify places request failed:', response.status, body.slice(0, 300))
      return { elements: [], error: `Geoapify returned ${response.status}` }
    }

    const data = await response.json()
    console.info(`Geoapify [${categories.join(',')}] (radius ${radiusMeters}m) returned ${data.features?.length ?? 0} raw place(s)`)
    return { elements: data.features || [], error: null }
  } catch (err: any) {
    const reason = err?.name === 'AbortError' ? 'timed out' : err?.message || 'network error'
    console.warn('Geoapify places request error:', reason)
    return { elements: [], error: reason }
  }
}

function featuresToPlaces(features: any[], wantedCategories: string[], centerLat: number, centerLon: number): GuidePlace[] {
  // Geoapify categories are hierarchical (e.g. a pizza place may be tagged
  // "catering.restaurant.pizza" without also listing the parent
  // "catering.restaurant" separately) — matching only exact strings against
  // our requested top-level categories silently drops anything tagged more
  // specifically than that. Prefix matching catches both.
  const matches = (category: string, wanted: string) => category === wanted || category.startsWith(wanted + '.')

  return features
    .filter((f) => f.properties?.name && f.properties?.categories?.some((c: string) => wantedCategories.some((w) => matches(c, w))))
    .map((f) => {
      const matchedCategory = f.properties.categories.find((c: string) => wantedCategories.some((w) => matches(c, w)))
      const wantedMatch = wantedCategories.find((w) => matches(matchedCategory, w))
      const [lon, lat] = f.geometry?.coordinates || [null, null]
      if (lat === null || lon === null) return null
      return {
        name: f.properties.name as string,
        category: CATEGORY_LABELS[wantedMatch || ''] || 'Nearby spot',
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

  // Two independent requests, each with its own limit — this is the actual
  // fix for food showing 0 even in dense cities: one shared request meant
  // the (usually much larger) tourism result set could fill the entire
  // response before catering results were ever considered.
  const [attractionsResult, foodResult, wiki] = await Promise.all([
    fetchNearbyPlaces(latitude, longitude, 40000, ATTRACTION_CATEGORIES, 20),
    fetchNearbyPlaces(latitude, longitude, 40000, FOOD_CATEGORIES, 20),
    fetchWikiIntro(searchTerm),
  ])

  // Surfaced only if BOTH requests failed — one succeeding means the guide
  // still has something useful to show, so a single transient failure on
  // one category shouldn't block the whole feature.
  const placesError = attractionsResult.error && foodResult.error ? attractionsResult.error : null

  const attractions = featuresToPlaces(attractionsResult.elements, ATTRACTION_CATEGORIES, latitude, longitude).slice(0, 8)
  const food = featuresToPlaces(foodResult.elements, FOOD_CATEGORIES, latitude, longitude).slice(0, 8)

  // A short "known for" teaser built from the closest real attractions
  // found — genuinely more useful to a stranger than an encyclopedia
  // paragraph, and it's free: no new API, just surfacing data already
  // fetched in a more scannable way.
  const knownFor = attractions.length > 0 ? attractions.slice(0, 3).map((a) => a.name).join(', ') : null

  return {
    resolvedName: displayName.split(',').slice(0, 2).join(','),
    intro: wiki?.intro ?? null,
    introImageUrl: wiki?.imageUrl ?? null,
    wikiUrl: wiki?.url ?? null,
    knownFor,
    attractions,
    food,
    placesError,
  }
}