import { findSpeciesByName, SPECIES_CATALOG } from '../data/plantProfiles'
import type { CareProfile, IdentifyResult } from '../types'
import { loadSettings } from './settings'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Не удалось прочитать фото'))
    reader.readAsDataURL(file)
  })
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Не удалось прочитать фото'))
    reader.readAsDataURL(file)
  })
}

async function identifyWithPlantId(file: File, apiKey: string): Promise<IdentifyResult | null> {
  const image = await fileToBase64(file)
  const res = await fetch('https://api.plant.id/v2/identify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
    },
    body: JSON.stringify({
      images: [image],
      modifiers: ['similar_images'],
      plant_details: ['common_names', 'taxonomy'],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Plant.id ответил ${res.status}`)
  }

  const data = await res.json()
  const suggestion = data?.suggestions?.[0]
  if (!suggestion) return null

  const scientific: string = suggestion.plant_name || suggestion.plant_details?.scientific_name || 'Houseplant'
  const common: string =
    suggestion.plant_details?.common_names?.[0] || scientific
  const confidence = Number(suggestion.probability ?? 0)

  const matched = findSpeciesByName(scientific) || findSpeciesByName(common)
  if (matched) {
    return {
      species: matched.species,
      speciesRu: matched.speciesRu,
      confidence,
      careProfile: matched.care,
      source: 'plant.id',
    }
  }

  return {
    species: scientific,
    speciesRu: common,
    confidence,
    careProfile: SPECIES_CATALOG[SPECIES_CATALOG.length - 1].care,
    source: 'plant.id',
  }
}

/** Heuristic fallback when no API key: suggest likely houseplant profiles for user confirmation. */
export function heuristicSuggestions(): IdentifyResult[] {
  return SPECIES_CATALOG.filter((s) => s.id !== 'general').slice(0, 6).map((s) => ({
    species: s.species,
    speciesRu: s.speciesRu,
    confidence: 0,
    careProfile: s.care,
    source: 'heuristic' as const,
  }))
}

export function manualIdentify(speciesId: string): IdentifyResult {
  const option = SPECIES_CATALOG.find((s) => s.id === speciesId) ?? SPECIES_CATALOG[SPECIES_CATALOG.length - 1]
  return {
    species: option.species,
    speciesRu: option.speciesRu,
    confidence: 1,
    careProfile: option.care,
    source: 'manual',
  }
}

export async function identifyPlant(file: File): Promise<{
  result: IdentifyResult | null
  error?: string
  suggestions: IdentifyResult[]
}> {
  const settings = loadSettings()
  const suggestions = heuristicSuggestions()

  if (!settings.plantIdApiKey.trim()) {
    return {
      result: null,
      error: 'Добавьте ключ Plant.id в настройках для автораспознавания, или выберите вид вручную.',
      suggestions,
    }
  }

  try {
    const result = await identifyWithPlantId(file, settings.plantIdApiKey.trim())
    return { result, suggestions }
  } catch (e) {
    return {
      result: null,
      error: e instanceof Error ? e.message : 'Ошибка распознавания',
      suggestions,
    }
  }
}

export function profileFromResult(result: IdentifyResult): CareProfile {
  return result.careProfile
}
