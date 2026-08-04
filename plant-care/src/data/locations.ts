export const PLANT_LOCATIONS = [
  'Подоконник',
  'Балкон',
  'Кухня',
  'Гостиная',
  'Спальня',
  'Коридор',
  'Двор / сад',
  'Улица / палисадник',
  'Терраса',
  'Другое',
] as const

export type PlantLocationPreset = (typeof PLANT_LOCATIONS)[number]
