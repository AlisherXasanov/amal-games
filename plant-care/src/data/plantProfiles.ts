import type { CareProfile, PlantCategory } from '../types'

export interface SpeciesOption {
  id: string
  species: string
  speciesRu: string
  category: PlantCategory
  care: CareProfile
  keywords: string[]
}

const base = (
  category: PlantCategory,
  water: number,
  feed: number,
  repot: number,
  light: CareProfile['light'],
  fertilizerType: string,
  soilType: string,
  winterRest = true,
): CareProfile => ({
  category,
  waterIntervalDays: water,
  feedIntervalDays: feed,
  repotIntervalMonths: repot,
  light,
  fertilizerType,
  soilType,
  winterRest,
})

export const SPECIES_CATALOG: SpeciesOption[] = [
  {
    id: 'aloe',
    species: 'Aloe vera',
    speciesRu: 'Алоэ вера',
    category: 'succulent',
    care: base('succulent', 14, 45, 24, 'bright', 'Удобрение для суккулентов', 'Грунт для кактусов и суккулентов'),
    keywords: ['aloe', 'алоэ'],
  },
  {
    id: 'echeveria',
    species: 'Echeveria',
    speciesRu: 'Эхеверия',
    category: 'succulent',
    care: base('succulent', 12, 40, 24, 'direct', 'Удобрение для суккулентов', 'Грунт для кактусов и суккулентов'),
    keywords: ['echeveria', 'эхеверия', 'суккулент'],
  },
  {
    id: 'monstera',
    species: 'Monstera deliciosa',
    speciesRu: 'Монстера',
    category: 'tropical',
    care: base('tropical', 7, 21, 18, 'bright', 'Удобрение для декоративно-лиственных', 'Грунт для ароидных'),
    keywords: ['monstera', 'монстера'],
  },
  {
    id: 'pothos',
    species: 'Epipremnum aureum',
    speciesRu: 'Эпипремнум (потос)',
    category: 'tropical',
    care: base('tropical', 8, 28, 24, 'medium', 'Универсальное удобрение для комнатных', 'Универсальный грунт'),
    keywords: ['pothos', 'эпипремнум', 'потос', 'scindapsus'],
  },
  {
    id: 'fiddle',
    species: 'Ficus lyrata',
    speciesRu: 'Фикус лировидный',
    category: 'tropical',
    care: base('tropical', 9, 30, 24, 'bright', 'Удобрение для фикусов', 'Грунт для фикусов'),
    keywords: ['ficus', 'фикус', 'lyrata'],
  },
  {
    id: 'peace-lily',
    species: 'Spathiphyllum',
    speciesRu: 'Спатифиллум',
    category: 'flowering',
    care: base('flowering', 5, 18, 18, 'medium', 'Удобрение для цветущих комнатных', 'Грунт для цветущих'),
    keywords: ['spathiphyllum', 'спатифиллум', 'peace lily'],
  },
  {
    id: 'orchid',
    species: 'Phalaenopsis',
    speciesRu: 'Орхидея фаленопсис',
    category: 'flowering',
    care: base('flowering', 7, 21, 24, 'bright', 'Удобрение для орхидей', 'Кора для орхидей'),
    keywords: ['orchid', 'орхидея', 'phalaenopsis', 'фаленопсис'],
  },
  {
    id: 'violet',
    species: 'Saintpaulia',
    speciesRu: 'Фиалка узамбарская',
    category: 'flowering',
    care: base('flowering', 5, 14, 12, 'bright', 'Удобрение для фиалок', 'Грунт для фиалок', false),
    keywords: ['saintpaulia', 'фиалка', 'violet'],
  },
  {
    id: 'fern',
    species: 'Nephrolepis exaltata',
    speciesRu: 'Нефролепис (папоротник)',
    category: 'fern',
    care: base('fern', 4, 21, 18, 'medium', 'Удобрение для папоротников', 'Рыхлый влажный грунт'),
    keywords: ['fern', 'папоротник', 'nephrolepis'],
  },
  {
    id: 'basil',
    species: 'Ocimum basilicum',
    speciesRu: 'Базилик',
    category: 'herb',
    care: base('herb', 3, 14, 12, 'direct', 'Удобрение для зелени и трав', 'Лёгкий питательный грунт', false),
    keywords: ['basil', 'базилик'],
  },
  {
    id: 'snake',
    species: 'Dracaena trifasciata',
    speciesRu: 'Сансевиерия',
    category: 'succulent',
    care: base('succulent', 18, 60, 36, 'low', 'Удобрение для суккулентов', 'Грунт для кактусов и суккулентов'),
    keywords: ['sansevieria', 'сансевиерия', 'snake plant', 'драцена'],
  },
  {
    id: 'general',
    species: 'Houseplant',
    speciesRu: 'Комнатное растение',
    category: 'general',
    care: base('general', 7, 28, 18, 'medium', 'Универсальное удобрение для комнатных', 'Универсальный грунт'),
    keywords: ['plant', 'растение', 'цветок'],
  },
]

export function findSpeciesByName(name: string): SpeciesOption | undefined {
  const q = name.toLowerCase()
  return SPECIES_CATALOG.find(
    (s) =>
      s.species.toLowerCase().includes(q) ||
      s.speciesRu.toLowerCase().includes(q) ||
      s.keywords.some((k) => q.includes(k) || k.includes(q)),
  )
}

export function defaultCareForCategory(category: PlantCategory): CareProfile {
  const match = SPECIES_CATALOG.find((s) => s.category === category)
  return match?.care ?? SPECIES_CATALOG[SPECIES_CATALOG.length - 1].care
}

export const CATEGORY_LABELS: Record<PlantCategory, string> = {
  succulent: 'Суккулент',
  tropical: 'Тропическое',
  flowering: 'Цветущее',
  fern: 'Папоротник',
  herb: 'Пряная зелень',
  general: 'Комнатное',
}
