const WEATHER_CODES: Record<number, string> = {
  0: '☀️ Clear sky',
  1: '🌤️ Mostly clear',
  2: '⛅ Partly cloudy',
  3: '☁️ Overcast',
  45: '🌫️ Foggy',
  48: '🌫️ Foggy',
  51: '🌦️ Light drizzle',
  61: '🌧️ Light rain',
  63: '🌧️ Rain',
  65: '🌧️ Heavy rain',
  71: '🌨️ Light snow',
  73: '🌨️ Snow',
  75: '❄️ Heavy snow',
  80: '🌦️ Rain showers',
  95: '⛈️ Thunderstorm',
}

export type WeatherResult = {
  temperature: number
  description: string
}

/**
 * Fetches current weather for a location using Open-Meteo — free, no API key.
 * Only gives current conditions, not a forecast for future trip dates,
 * since Open-Meteo's free forecast range is limited; good enough for
 * "what's it like there right now" but not a full trip-length forecast.
 */
export async function fetchCurrentWeather(latitude: number, longitude: number): Promise<WeatherResult | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    const current = data.current_weather
    if (!current) return null

    return {
      temperature: Math.round(current.temperature),
      description: WEATHER_CODES[current.weathercode] || '🌡️ Weather data',
    }
  } catch {
    return null
  }
}