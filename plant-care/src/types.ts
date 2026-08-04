export type PlantCategory =
  | 'succulent'
  | 'tropical'
  | 'flowering'
  | 'fern'
  | 'herb'
  | 'general'

export type LightNeed = 'low' | 'medium' | 'bright' | 'direct'

export interface CareProfile {
  category: PlantCategory
  waterIntervalDays: number
  feedIntervalDays: number
  repotIntervalMonths: number
  light: LightNeed
  fertilizerType: string
  soilType: string
  winterRest: boolean
}

export interface Plant {
  id: string
  name: string
  species: string
  speciesRu: string
  /** Where the plant stands: room, balcony, yard, etc. */
  location?: string
  photoDataUrl?: string
  addedAt: string
  lastWateredAt?: string
  lastFedAt?: string
  lastRepottedAt?: string
  careProfile: CareProfile
  notes?: string
  potSizeCm?: number
  needsRepotFlag?: boolean
}

export type CareUrgency = 'overdue' | 'due' | 'soon' | 'ok'

export interface PlantStatus {
  water: CareUrgency
  feed: CareUrgency
  repot: CareUrgency
  nextWaterInDays: number
  nextFeedInDays: number
  waterLabel: string
  feedLabel: string
  repotLabel: string
  primaryAction: 'water' | 'feed' | 'repot' | 'ok'
  summary: string
}

export interface ClimateSnapshot {
  lat: number
  lon: number
  temperatureC: number
  humidity: number
  season: Season
  cityLabel: string
  fetchedAt: string
}

export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

export interface AppSettings {
  plantIdApiKey: string
  cityLabel: string
  lat: number | null
  lon: number | null
  useGeolocation: boolean
}

export interface ShopItem {
  id: string
  title: string
  kind: 'fertilizer' | 'soil' | 'pot' | 'other'
  query: string
  reason: string
  forCategories: PlantCategory[]
}

export interface IdentifyResult {
  species: string
  speciesRu: string
  confidence: number
  careProfile: CareProfile
  source: 'plant.id' | 'manual' | 'heuristic'
}
