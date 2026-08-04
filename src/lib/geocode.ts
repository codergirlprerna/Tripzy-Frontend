/**
 * Turns GPS coordinates into a readable place name, e.g. "Interlaken, Switzerland".
 * Uses OpenStreetMap's free Nominatim API — no key required, but rate-limited to
 * roughly 1 request/second and intended for light usage. If Tripzy's photo-upload
 * volume grows meaningfully, this should be swapped for a paid provider
 * (Google Geocoding API or Mapbox) that can handle real production traffic
 * and won't rate-limit real users. Flagging that now so it isn't a surprise later.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    const address = data.address

    if (!address) return null

    const place = address.city || address.town || address.village || address.county
    const country = address.country

    if (place && country) return `${place}, ${country}`
    if (country) return country
    return null
  } catch {
    return null
  }
}

export type LocationResult = {
  displayName: string
  latitude: number
  longitude: number
}

/**
 * Searches for a place by name (e.g. "Interlaken") and returns candidate matches
 * with coordinates. Same Nominatim rate-limit caveat as reverseGeocode above applies.
 */
export async function searchLocation(searchQuery: string): Promise<LocationResult[]> {
  if (!searchQuery.trim()) return []

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
    const response = await fetch(url)
    if (!response.ok) return []

    const data = await response.json()
    return data.map((item: any) => ({
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }))
  } catch {
    return []
  }
}