import { Link } from 'react-router-dom'
import { getPlantStatus } from '../lib/care'
import type { ClimateSnapshot, Plant } from '../types'
import { StatusBadge } from './StatusBadge'

export function PlantListItem({ plant, climate }: { plant: Plant; climate: ClimateSnapshot | null }) {
  const status = getPlantStatus(plant, climate ?? undefined)
  const urgency =
    status.primaryAction === 'water'
      ? status.water
      : status.primaryAction === 'feed'
        ? status.feed
        : status.primaryAction === 'repot'
          ? status.repot
          : 'ok'

  return (
    <Link to={`/plant/${plant.id}`} className="plant-row">
      <div className="plant-thumb">
        {plant.photoDataUrl ? (
          <img src={plant.photoDataUrl} alt={plant.name} />
        ) : (
          <div className="plant-thumb-fallback" aria-hidden>
            ◌
          </div>
        )}
      </div>
      <div className="plant-row-body">
        <div className="plant-row-top">
          <h3>{plant.name}</h3>
          <StatusBadge urgency={urgency} text={status.summary} />
        </div>
        <p className="muted">{plant.speciesRu}</p>
      </div>
    </Link>
  )
}
