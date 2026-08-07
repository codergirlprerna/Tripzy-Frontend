export type DestinationGuide = {
  title: string
  extract: string
  thumbnailUrl: string | null
  pageUrl: string
}

/**
 * Pulls a short overview of the trip's destination from Wikipedia's free REST
 * summary endpoint — no API key required. This intentionally gives general
 * background on the place (history, geography, what it's known for), not
 * live "things to do" listings — a proper recommendations feed would need a
 * paid places API (Google Places, Foursquare) with per-request billing.
 *
 * `location` is the free-text string stored on the trip (e.g. "Interlaken,
 * Switzerland" or "Lisbon, Portugal") since that's what's already collected
 * at trip-creation time — no separate place ID to look up by.
 */
export async function fetchDestinationGuide(location: string): Promise<DestinationGuide | null> {
  const searchTerm = location.split(',')[0].trim()
  if (!searchTerm) return null

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()

    // Disambiguation pages and missing articles come back as 404-ish "type"
    // values rather than an HTTP error, so check explicitly.
    if (data.type === 'disambiguation' || !data.extract) return null

    return {
      title: data.title,
      extract: data.extract,
      thumbnailUrl: data.thumbnail?.source ?? null,
      pageUrl: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`,
    }
  } catch {
    return null
  }
}