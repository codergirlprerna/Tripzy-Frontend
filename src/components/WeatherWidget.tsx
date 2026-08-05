import { useEffect, useState } from 'react'
import { fetchCurrentWeather, WeatherResult } from '@/lib/weather'

export default function WeatherWidget({ latitude, longitude }: { latitude?: number; longitude?: number }) {
  const [weather, setWeather] = useState<WeatherResult | null>(null)

  useEffect(() => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return
    fetchCurrentWeather(latitude, longitude).then(setWeather)
  }, [latitude, longitude])

  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !weather) return null

  return (
    <div className="sticker-card inline-flex items-center gap-2 px-3 py-1.5 shadow-hard-sm">
      <span className="text-[13px] font-semibold">{weather.description}</span>
      <span className="font-mono text-[12px] font-bold">{weather.temperature}°C</span>
    </div>
  )
}