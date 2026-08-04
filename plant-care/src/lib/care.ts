import type { CareUrgency, ClimateSnapshot, Plant, PlantStatus, Season } from '../types'
import { SEASON_LABELS } from './climate'

const DAY_MS = 24 * 60 * 60 * 1000

function daysSince(iso?: string, now = Date.now()): number | null {
  if (!iso) return null
  return (now - new Date(iso).getTime()) / DAY_MS
}

function waterInterval(plant: Plant, climate?: ClimateSnapshot): number {
  let days = plant.careProfile.waterIntervalDays
  const season = climate?.season
  const cat = plant.careProfile.category

  if (season === 'winter') {
    days *= cat === 'succulent' ? 1.6 : 1.4
  } else if (season === 'summer') {
    days *= cat === 'succulent' ? 0.9 : 0.75
  } else if (season === 'spring') {
    days *= 0.95
  }

  if (climate) {
    if (climate.temperatureC >= 28 && cat !== 'succulent') days *= 0.85
    if (climate.temperatureC <= 14) days *= 1.25
    if (climate.humidity >= 70 && cat !== 'fern') days *= 1.1
    if (climate.humidity <= 30 && (cat === 'tropical' || cat === 'fern')) days *= 0.85
  }

  return Math.max(2, Math.round(days))
}

function feedInterval(plant: Plant, climate?: ClimateSnapshot): number {
  let days = plant.careProfile.feedIntervalDays
  const season = climate?.season ?? getLocalSeason()

  if (plant.careProfile.winterRest && (season === 'winter' || season === 'autumn')) {
    return season === 'winter' ? 999 : Math.round(days * 1.6)
  }
  if (season === 'spring' || season === 'summer') {
    days *= 0.9
  }
  return Math.max(10, Math.round(days))
}

function getLocalSeason(): Season {
  const m = new Date().getMonth()
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 7) return 'summer'
  if (m >= 8 && m <= 10) return 'autumn'
  return 'winter'
}

function urgencyFromDaysLeft(daysLeft: number): CareUrgency {
  if (daysLeft <= -2) return 'overdue'
  if (daysLeft <= 0) return 'due'
  if (daysLeft <= 2) return 'soon'
  return 'ok'
}

function labelFor(kind: 'water' | 'feed' | 'repot', urgency: CareUrgency, daysLeft: number): string {
  if (kind === 'repot') {
    if (urgency === 'overdue' || urgency === 'due') return 'Пора пересадить'
    if (urgency === 'soon') return 'Скоро пересадка'
    return 'Пересадка не срочна'
  }
  const action = kind === 'water' ? 'Полить' : 'Подкормить'
  if (urgency === 'overdue') return `${action} срочно`
  if (urgency === 'due') return `Сегодня: ${action.toLowerCase()}`
  if (urgency === 'soon') return `Через ${Math.ceil(daysLeft)} дн.`
  return `Через ${Math.ceil(daysLeft)} дн.`
}

export function getPlantStatus(plant: Plant, climate?: ClimateSnapshot, now = Date.now()): PlantStatus {
  const wInterval = waterInterval(plant, climate)
  const fInterval = feedInterval(plant, climate)
  const sinceWater = daysSince(plant.lastWateredAt, now)
  const sinceFeed = daysSince(plant.lastFedAt, now)
  const sinceRepot = daysSince(plant.lastRepottedAt ?? plant.addedAt, now)
  const repotDays = plant.careProfile.repotIntervalMonths * 30

  const nextWaterInDays = sinceWater == null ? 0 : wInterval - sinceWater
  const nextFeedInDays = sinceFeed == null ? 0 : fInterval - sinceFeed
  const nextRepotInDays = sinceRepot == null ? 0 : repotDays - sinceRepot

  let water = urgencyFromDaysLeft(nextWaterInDays)
  let feed = urgencyFromDaysLeft(nextFeedInDays)
  let repot = plant.needsRepotFlag
    ? 'due'
    : urgencyFromDaysLeft(nextRepotInDays)

  // Soften feed urgency in deep winter rest
  if (fInterval >= 900) {
    feed = 'ok'
  }

  // Prefer spring for repot messaging
  const season = climate?.season ?? getLocalSeason()
  if (repot === 'due' && season !== 'spring' && season !== 'summer' && !plant.needsRepotFlag) {
    repot = 'soon'
  }

  const waterLabel = sinceWater == null ? 'Полить впервые' : labelFor('water', water, nextWaterInDays)
  const feedLabel =
    fInterval >= 900
      ? 'Подкормка не нужна сейчас'
      : sinceFeed == null
        ? 'Подкормить впервые'
        : labelFor('feed', feed, nextFeedInDays)
  const repotLabel = labelFor('repot', repot, nextRepotInDays)

  let primaryAction: PlantStatus['primaryAction'] = 'ok'
  if (water === 'overdue' || water === 'due') primaryAction = 'water'
  else if (feed === 'overdue' || feed === 'due') primaryAction = 'feed'
  else if (repot === 'overdue' || repot === 'due') primaryAction = 'repot'

  const summary =
    primaryAction === 'water'
      ? waterLabel
      : primaryAction === 'feed'
        ? feedLabel
        : primaryAction === 'repot'
          ? repotLabel
          : 'Всё хорошо'

  return {
    water,
    feed,
    repot,
    nextWaterInDays,
    nextFeedInDays,
    waterLabel,
    feedLabel,
    repotLabel,
    primaryAction,
    summary,
  }
}

export function careTips(plant: Plant, climate?: ClimateSnapshot): string[] {
  const tips: string[] = []
  const season = climate?.season ?? getLocalSeason()
  const status = getPlantStatus(plant, climate)

  tips.push(
    `Полив примерно раз в ${waterInterval(plant, climate)} дн., подкормка — раз в ${
      feedInterval(plant, climate) >= 900 ? '—' : feedInterval(plant, climate)
    } дн. (с учётом сезона: ${SEASON_LABELS[season]}).`,
  )

  if (status.water === 'due' || status.water === 'overdue') {
    tips.push('Проверьте грунт пальцем на 2–3 см: если сухо — пора поливать. Лишнюю воду из поддона слейте.')
  }

  if (plant.careProfile.winterRest && (season === 'winter' || season === 'autumn')) {
    tips.push('Сейчас период покоя: не перекармливайте и не устраивайте частый полив.')
  } else if (status.feed === 'due' || status.feed === 'overdue') {
    tips.push(`Рекомендуемая подкормка: ${plant.careProfile.fertilizerType}. Разведите по инструкции, лучше во влажный грунт.`)
  }

  if (status.repot === 'due' || plant.needsRepotFlag) {
    tips.push(
      season === 'spring' || season === 'summer'
        ? `Хорошее время для пересадки в ${plant.careProfile.soilType.toLowerCase()}. Возьмите горшок на 2–3 см шире.`
        : 'Пересадка желательна, но лучше дождаться весны, если растение не в критическом состоянии.',
    )
  }

  if (climate && climate.humidity < 35 && (plant.careProfile.category === 'tropical' || plant.careProfile.category === 'fern')) {
    tips.push('Влажность низкая — повысьте её вокруг кроны, не заливая корни.')
  }

  return tips
}

export function markWatered(plant: Plant): Plant {
  return { ...plant, lastWateredAt: new Date().toISOString() }
}

export function markFed(plant: Plant): Plant {
  return { ...plant, lastFedAt: new Date().toISOString() }
}

export function markRepotted(plant: Plant): Plant {
  return {
    ...plant,
    lastRepottedAt: new Date().toISOString(),
    needsRepotFlag: false,
  }
}
