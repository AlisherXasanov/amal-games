import type { AppSettings } from '../types'

const KEY = 'plant-care-settings'

const DEFAULTS: AppSettings = {
  plantIdApiKey: '',
  cityLabel: 'Москва',
  lat: 55.7558,
  lon: 37.6173,
  useGeolocation: true,
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}
