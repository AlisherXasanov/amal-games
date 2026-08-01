import type { ClimateSnapshot, Season } from '../types'
import { loadSettings } from './settings'

export function getSeason(date = new Date(), lat = 55): Season {
  const month = date.getMonth()
  const southern = lat < 0
  // Northern hemisphere months; flip for southern
  let season: Season
  if (month >= 2 && month <= 4) season = 'spring'
  else if (month >= 5 && month <= 7) season = 'summer'
  else if (month >= 8 && month <= 10) season = 'autumn'
  else season = 'winter'

  if (!southern) return season
  const flip: Record<Season, Season> = {
    winter: 'summer',
    summer: 'winter',
    spring: 'autumn',
    autumn: 'spring',
  }
  return flip[season]
}

export const SEASON_LABELS: Record<Season, string> = {
  winter: 'зима',
  spring: 'весна',
  summer: 'лето',
  autumn: 'осень',
}

async function resolveCoords(): Promise<{ lat: number; lon: number; cityLabel: string }> {
  const settings = loadSettings()
  if (settings.useGeolocation && 'geolocation' in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 60 * 60 * 1000,
        })
      })
      return {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        cityLabel: settings.cityLabel || 'Ваше местоположение',
      }
    } catch {
      // fall through
    }
  }
  return {
    lat: settings.lat ?? 41.2995,
    lon: settings.lon ?? 69.2401,
    cityLabel: settings.cityLabel || 'Узбекистан',
  }
}

export async function fetchClimate(): Promise<ClimateSnapshot> {
  const { lat, lon, cityLabel } = await resolveCoords()
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m&timezone=auto`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Не удалось получить погоду')
  const data = await res.json()
  const temperatureC = Number(data?.current?.temperature_2m ?? 20)
  const humidity = Number(data?.current?.relative_humidity_2m ?? 50)

  return {
    lat,
    lon,
    temperatureC,
    humidity,
    season: getSeason(new Date(), lat),
    cityLabel,
    fetchedAt: new Date().toISOString(),
  }
}

export function climateAdvice(climate: ClimateSnapshot): string {
  const parts: string[] = []
  parts.push(`Сейчас ${SEASON_LABELS[climate.season]}, около ${Math.round(climate.temperatureC)}°C, влажность ${Math.round(climate.humidity)}%.`)

  if (climate.season === 'winter') {
    parts.push('Зимой большинству растений нужен более редкий полив и почти без подкормок.')
  } else if (climate.season === 'spring') {
    parts.push('Весна — лучшее время для пересадки и возобновления подкормок.')
  } else if (climate.season === 'summer') {
    parts.push('Летом следите за пересыханием грунта, особенно у влаголюбивых.')
  } else {
    parts.push('Осенью постепенно сокращайте полив и готовьте растения к периоду покоя.')
  }

  if (climate.humidity < 35) {
    parts.push('Воздух сухой — тропическим видам поможет опрыскивание или поддон с влажным керамзитом.')
  } else if (climate.humidity > 75) {
    parts.push('Влажность высокая — проветривайте и не заливайте суккуленты.')
  }

  return parts.join(' ')
}
