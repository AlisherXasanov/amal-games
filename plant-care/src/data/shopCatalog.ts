import type { PlantCategory, ShopItem } from '../types'

export const SHOP_CATALOG: ShopItem[] = [
  {
    id: 'fert-universal',
    title: 'Универсальное удобрение для комнатных',
    kind: 'fertilizer',
    query: 'удобрение для комнатных растений',
    reason: 'Подходит большинству зелёных питомцев в период роста.',
    forCategories: ['general', 'tropical', 'herb'],
  },
  {
    id: 'fert-succulent',
    title: 'Удобрение для суккулентов и кактусов',
    kind: 'fertilizer',
    query: 'удобрение для суккулентов',
    reason: 'Мягкая формула без избытка азота — безопаснее для толстолистых.',
    forCategories: ['succulent'],
  },
  {
    id: 'fert-flowering',
    title: 'Удобрение для цветущих комнатных',
    kind: 'fertilizer',
    query: 'удобрение для цветущих комнатных растений',
    reason: 'Поддерживает бутоны и повторное цветение.',
    forCategories: ['flowering'],
  },
  {
    id: 'fert-orchid',
    title: 'Удобрение для орхидей',
    kind: 'fertilizer',
    query: 'удобрение для орхидей фаленопсис',
    reason: 'Сбалансированная подкормка специально для орхидей.',
    forCategories: ['flowering'],
  },
  {
    id: 'fert-fern',
    title: 'Удобрение для папоротников',
    kind: 'fertilizer',
    query: 'удобрение для папоротников',
    reason: 'Деликатная подкормка для влаголюбивой листвы.',
    forCategories: ['fern'],
  },
  {
    id: 'soil-universal',
    title: 'Универсальный грунт',
    kind: 'soil',
    query: 'грунт универсальный для комнатных растений',
    reason: 'База для большинства растений при пересадке.',
    forCategories: ['general', 'tropical', 'herb', 'flowering'],
  },
  {
    id: 'soil-succulent',
    title: 'Грунт для суккулентов',
    kind: 'soil',
    query: 'грунт для кактусов и суккулентов',
    reason: 'Быстро просыхает и снижает риск загнивания корней.',
    forCategories: ['succulent'],
  },
  {
    id: 'soil-orchid',
    title: 'Кора / субстрат для орхидей',
    kind: 'soil',
    query: 'кора для орхидей субстрат',
    reason: 'Воздухопроницаемый субстрат вместо обычной земли.',
    forCategories: ['flowering'],
  },
  {
    id: 'soil-fern',
    title: 'Рыхлый грунт для папоротников',
    kind: 'soil',
    query: 'грунт для папоротников',
    reason: 'Держит влагу, но остаётся рыхлым.',
    forCategories: ['fern'],
  },
  {
    id: 'pot-plastic',
    title: 'Горшок с дренажными отверстиями',
    kind: 'pot',
    query: 'горшок для цветов с дренажными отверстиями',
    reason: 'Лишняя вода должна уходить — это основа здоровья корней.',
    forCategories: ['general', 'tropical', 'flowering', 'fern', 'herb', 'succulent'],
  },
  {
    id: 'pot-terracotta',
    title: 'Глиняный горшок',
    kind: 'pot',
    query: 'глиняный горшок для цветов',
    reason: 'Хорошо «дышит» и помогает суккулентам не переувлажняться.',
    forCategories: ['succulent'],
  },
  {
    id: 'drainage',
    title: 'Дренаж керамзит',
    kind: 'other',
    query: 'керамзит дренаж для цветов',
    reason: 'Слой на дне горшка при любой пересадке.',
    forCategories: ['general', 'tropical', 'flowering', 'fern', 'herb', 'succulent'],
  },
]

export function itemsForCategory(category: PlantCategory, kinds?: ShopItem['kind'][]): ShopItem[] {
  return SHOP_CATALOG.filter(
    (item) =>
      item.forCategories.includes(category) &&
      (!kinds || kinds.includes(item.kind)),
  )
}
