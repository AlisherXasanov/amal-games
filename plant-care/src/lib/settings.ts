import type { AppSettings } from '../types'

const KEY = 'plant-care-settings'

const DEFAULTS: AppSettings = {
  plantIdApiKey: '',
  cityLabel: 'Узбекистан',
  lat: 41.2995,
  lon: 69.2401,
  useGeolocation: true,
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as AppSettings
    // Migrate previous Moscow default to Uzbekistan
    if (parsed.cityLabel === 'Москва' || parsed.cityLabel === 'Moscow') {
      parsed.cityLabel = DEFAULTS.cityLabel
      parsed.lat = DEFAULTS.lat
      parsed.lon = DEFAULTS.lon
      saveSettings(parsed)
    }
    return parsed
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}
