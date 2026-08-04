import { Link } from 'react-router-dom'
import { PlantListItem } from '../components/PlantListItem'
import { useApp } from '../context/AppContext'
import { climateAdvice, SEASON_LABELS } from '../lib/climate'
import { getPlantStatus } from '../lib/care'

export function HomePage() {
  const { plants, loading, climate, climateError } = useApp()

  const needingCare = plants.filter((p) => {
    const s = getPlantStatus(p, climate ?? undefined)
    return s.primaryAction !== 'ok'
  }).length

  return (
    <section className="page home-page">
      <header className="page-hero">
        <p className="brand">Цветы</p>
        <h1>Ваши растения</h1>
        <p className="lede">
          {loading
            ? 'Загружаем коллекцию…'
            : plants.length === 0
              ? 'Добавьте первый цветок по фото — подскажем полив, подкормку и пересадку.'
              : needingCare > 0
                ? `Сегодня нужно внимание: ${needingCare}`
                : 'Все цветы в хорошем состоянии.'}
        </p>
      </header>

      {climate && (
        <div className="climate-strip reveal">
          <strong>
            {climate.cityLabel} · {SEASON_LABELS[climate.season]}
          </strong>
          <span>
            {Math.round(climate.temperatureC)}°C · влажность {Math.round(climate.humidity)}%
          </span>
          <p>{climateAdvice(climate)}</p>
        </div>
      )}
      {climateError && !climate && <p className="muted">{climateError}</p>}

      <div className="section-head">
        <h2>Коллекция</h2>
        <Link to="/add" className="text-link">
          + Добавить
        </Link>
      </div>

      {loading ? (
        <p className="muted">Загрузка…</p>
      ) : plants.length === 0 ? (
        <div className="empty-state">
          <p>Пока нет растений.</p>
          <Link to="/add" className="btn primary">
            Сфотографировать цветок
          </Link>
        </div>
      ) : (
        <div className="plant-list">
          {plants.map((plant, i) => (
            <div key={plant.id} className="reveal" style={{ animationDelay: `${i * 40}ms` }}>
              <PlantListItem plant={plant} climate={climate} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
