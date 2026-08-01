import { itemsForCategory } from '../data/shopCatalog'
import type { Plant, ShopItem } from '../types'

export function shopRecommendations(plant: Plant): ShopItem[] {
  const cat = plant.careProfile.category
  const fertilizers = itemsForCategory(cat, ['fertilizer'])
  const soils = itemsForCategory(cat, ['soil'])
  const pots = itemsForCategory(cat, ['pot'])
  const other = itemsForCategory(cat, ['other'])

  // Prefer fertilizer matching care profile text
  const sortedFert = [...fertilizers].sort((a, b) => {
    const aMatch = plant.careProfile.fertilizerType.toLowerCase().includes(a.query.split(' ')[0] ?? '')
    const bMatch = plant.careProfile.fertilizerType.toLowerCase().includes(b.query.split(' ')[0] ?? '')
    return Number(bMatch) - Number(aMatch)
  })

  const picked: ShopItem[] = []
  if (sortedFert[0]) picked.push(sortedFert[0])
  if (soils[0]) picked.push(soils[0])
  if (pots[0]) picked.push(pots[0])
  if (other[0]) picked.push(other[0])

  // Orchid-specific extra
  if (plant.speciesRu.toLowerCase().includes('орхид') || plant.species.toLowerCase().includes('phalaenopsis')) {
    const orchidFert = fertilizers.find((f) => f.id === 'fert-orchid')
    const orchidSoil = soils.find((s) => s.id === 'soil-orchid')
    if (orchidFert) picked[0] = orchidFert
    if (orchidSoil) picked[1] = orchidSoil
  }

  return picked
}

export function marketSearchUrls(query: string): { name: string; url: string }[] {
  const q = encodeURIComponent(query)
  return [
    { name: 'Wildberries', url: `https://www.wildberries.ru/catalog/0/search.aspx?search=${q}` },
    { name: 'Ozon', url: `https://www.ozon.ru/search/?text=${q}` },
    { name: 'Яндекс Маркет', url: `https://market.yandex.ru/search?text=${q}` },
  ]
}
