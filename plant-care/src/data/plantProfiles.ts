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
    id: 'cactus',
    species: 'Cactaceae',
    speciesRu: 'Кактус',
    category: 'succulent',
    care: base('succulent', 16, 50, 36, 'direct', 'Удобрение для кактусов', 'Грунт для кактусов и суккулентов'),
    keywords: ['cactus', 'кактус'],
  },
  {
    id: 'crassula',
    species: 'Crassula ovata',
    speciesRu: 'Толстянка (денежное дерево)',
    category: 'succulent',
    care: base('succulent', 12, 40, 24, 'bright', 'Удобрение для суккулентов', 'Грунт для кактусов и суккулентов'),
    keywords: ['crassula', 'толстянка', 'денежное'],
  },
  {
    id: 'snake',
    species: 'Dracaena trifasciata',
    speciesRu: 'Сансевиерия',
    category: 'succulent',
    care: base('succulent', 18, 60, 36, 'low', 'Удобрение для суккулентов', 'Грунт для кактусов и суккулентов'),
    keywords: ['sansevieria', 'сансевиерия', 'snake plant', 'щучий хвост'],
  },
  {
    id: 'zz',
    species: 'Zamioculcas zamiifolia',
    speciesRu: 'Замиокулькас',
    category: 'tropical',
    care: base('tropical', 14, 40, 24, 'low', 'Универсальное удобрение для комнатных', 'Рыхлый универсальный грунт'),
    keywords: ['zamioculcas', 'замиокулькас', 'долларовое'],
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
    id: 'philodendron',
    species: 'Philodendron',
    speciesRu: 'Филодендрон',
    category: 'tropical',
    care: base('tropical', 7, 21, 18, 'medium', 'Удобрение для декоративно-лиственных', 'Грунт для ароидных'),
    keywords: ['philodendron', 'филодендрон'],
  },
  {
    id: 'fiddle',
    species: 'Ficus lyrata',
    speciesRu: 'Фикус лировидный',
    category: 'tropical',
    care: base('tropical', 9, 30, 24, 'bright', 'Удобрение для фикусов', 'Грунт для фикусов'),
    keywords: ['ficus lyrata', 'фикус лировидный'],
  },
  {
    id: 'ficus-benjamina',
    species: 'Ficus benjamina',
    speciesRu: 'Фикус Бенджамина',
    category: 'tropical',
    care: base('tropical', 7, 21, 18, 'bright', 'Удобрение для фикусов', 'Грунт для фикусов'),
    keywords: ['benjamina', 'фикус бенджамина', 'фикус'],
  },
  {
    id: 'rubber',
    species: 'Ficus elastica',
    speciesRu: 'Фикус каучуконосный',
    category: 'tropical',
    care: base('tropical', 9, 28, 24, 'bright', 'Удобрение для фикусов', 'Грунт для фикусов'),
    keywords: ['elastica', 'каучуконосный', 'резиновый'],
  },
  {
    id: 'dracaena',
    species: 'Dracaena',
    speciesRu: 'Драцена',
    category: 'tropical',
    care: base('tropical', 10, 30, 24, 'medium', 'Универсальное удобрение для комнатных', 'Универсальный грунт'),
    keywords: ['dracaena', 'драцена'],
  },
  {
    id: 'yucca',
    species: 'Yucca',
    speciesRu: 'Юкка',
    category: 'tropical',
    care: base('tropical', 12, 35, 24, 'bright', 'Универсальное удобрение для комнатных', 'Рыхлый грунт'),
    keywords: ['yucca', 'юкка'],
  },
  {
    id: 'calathea',
    species: 'Calathea',
    speciesRu: 'Калатея',
    category: 'tropical',
    care: base('tropical', 5, 21, 18, 'medium', 'Удобрение для декоративно-лиственных', 'Рыхлый влажный грунт'),
    keywords: ['calathea', 'калатея', 'маранта'],
  },
  {
    id: 'tradescantia',
    species: 'Tradescantia',
    speciesRu: 'Традесканция',
    category: 'tropical',
    care: base('tropical', 5, 21, 18, 'bright', 'Универсальное удобрение для комнатных', 'Универсальный грунт'),
    keywords: ['tradescantia', 'традесканция'],
  },
  {
    id: 'chlorophytum',
    species: 'Chlorophytum comosum',
    speciesRu: 'Хлорофитум',
    category: 'tropical',
    care: base('tropical', 5, 21, 18, 'medium', 'Универсальное удобрение для комнатных', 'Универсальный грунт'),
    keywords: ['chlorophytum', 'хлорофитум'],
  },
  {
    id: 'peace-lily',
    species: 'Spathiphyllum',
    speciesRu: 'Спатифиллум',
    category: 'flowering',
    care: base('flowering', 5, 18, 18, 'medium', 'Удобрение для цветущих комнатных', 'Грунт для цветущих'),
    keywords: ['spathiphyllum', 'спатифиллум', 'женское счастье'],
  },
  {
    id: 'anthurium',
    species: 'Anthurium',
    speciesRu: 'Антуриум',
    category: 'flowering',
    care: base('flowering', 5, 18, 18, 'bright', 'Удобрение для цветущих комнатных', 'Грунт для ароидных'),
    keywords: ['anthurium', 'антуриум', 'мужское счастье'],
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
    id: 'geranium',
    species: 'Pelargonium',
    speciesRu: 'Герань (пеларгония)',
    category: 'flowering',
    care: base('flowering', 5, 14, 18, 'bright', 'Удобрение для цветущих комнатных', 'Универсальный грунт', false),
    keywords: ['geranium', 'герань', 'пеларгония', 'pelargonium'],
  },
  {
    id: 'begonia',
    species: 'Begonia',
    speciesRu: 'Бегония',
    category: 'flowering',
    care: base('flowering', 5, 18, 18, 'bright', 'Удобрение для цветущих комнатных', 'Рыхлый питательный грунт'),
    keywords: ['begonia', 'бегония'],
  },
  {
    id: 'rose',
    species: 'Rosa',
    speciesRu: 'Комнатная роза',
    category: 'flowering',
    care: base('flowering', 3, 14, 12, 'bright', 'Удобрение для роз', 'Грунт для роз', false),
    keywords: ['rose', 'роза'],
  },
  {
    id: 'hibiscus',
    species: 'Hibiscus rosa-sinensis',
    speciesRu: 'Гибискус (китайская роза)',
    category: 'flowering',
    care: base('flowering', 4, 14, 18, 'bright', 'Удобрение для цветущих комнатных', 'Питательный грунт'),
    keywords: ['hibiscus', 'гибискус', 'китайская роза'],
  },
  {
    id: 'kalanchoe',
    species: 'Kalanchoe',
    speciesRu: 'Каланхоэ',
    category: 'flowering',
    care: base('flowering', 10, 30, 24, 'bright', 'Удобрение для суккулентов', 'Грунт для суккулентов'),
    keywords: ['kalanchoe', 'каланхоэ'],
  },
  {
    id: 'cyclamen',
    species: 'Cyclamen',
    speciesRu: 'Цикламен',
    category: 'flowering',
    care: base('flowering', 5, 21, 18, 'bright', 'Удобрение для цветущих комнатных', 'Рыхлый грунт'),
    keywords: ['cyclamen', 'цикламен'],
  },
  {
    id: 'azalea',
    species: 'Rhododendron',
    speciesRu: 'Азалия',
    category: 'flowering',
    care: base('flowering', 3, 18, 18, 'bright', 'Удобрение для азалий', 'Кислый грунт для азалий'),
    keywords: ['azalea', 'азалия', 'рододендрон'],
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
    id: 'mint',
    species: 'Mentha',
    speciesRu: 'Мята',
    category: 'herb',
    care: base('herb', 3, 14, 12, 'bright', 'Удобрение для зелени и трав', 'Лёгкий питательный грунт', false),
    keywords: ['mint', 'мята'],
  },
  {
    id: 'aloe-tree',
    species: 'Aloe arborescens',
    speciesRu: 'Столетник',
    category: 'succulent',
    care: base('succulent', 14, 45, 24, 'bright', 'Удобрение для суккулентов', 'Грунт для суккулентов'),
    keywords: ['столетник', 'arborescens'],
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
  const q = name.toLowerCase().trim()
  if (!q) return undefined
  const exact = SPECIES_CATALOG.find(
    (s) => s.species.toLowerCase() === q || s.speciesRu.toLowerCase() === q,
  )
  if (exact) return exact
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

export function generalCareProfile(): CareProfile {
  return SPECIES_CATALOG[SPECIES_CATALOG.length - 1].care
}

export const CATEGORY_LABELS: Record<PlantCategory, string> = {
  succulent: 'Суккулент',
  tropical: 'Тропическое',
  flowering: 'Цветущее',
  fern: 'Папоротник',
  herb: 'Пряная зелень',
  general: 'Комнатное',
}
