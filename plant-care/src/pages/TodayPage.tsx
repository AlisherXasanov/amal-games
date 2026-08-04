import { useApp } from '../context/AppContext'
import { getPlantStatus, markFed, markWatered } from '../lib/care'
import { Link } from 'react-router-dom'

export function TodayPage() {
  const { plants, climate, upsertPlant } = useApp()

  const tasks = plants
    .map((plant) => ({ plant, status: getPlantStatus(plant, climate ?? undefined) }))
    .filter(({ status }) => status.water === 'due' || status.water === 'overdue' || status.feed === 'due' || status.feed === 'overdue' || status.repot === 'due' || status.repot === 'overdue')

  return (
    <section className="page">
      <header className="page-hero compact">
        <p className="brand">Цветы</p>
        <h1>Уход сегодня</h1>
        <p className="lede">Отмечайте полив и подкормку — статусы обновятся сразу.</p>
      </header>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <p>На сегодня задач нет. Можно просто заглянуть к цветам.</p>
          <Link to="/" className="btn ghost">
            К коллекции
          </Link>
        </div>
      ) : (
        <ul className="task-list">
          {tasks.map(({ plant, status }) => (
            <li key={plant.id} className="task-item reveal">
              <div className="task-head">
                <Link to={`/plant/${plant.id}`}>
                  <strong>{plant.name}</strong>
                </Link>
                <span className="muted">{plant.speciesRu}</span>
              </div>
              <div className="task-actions">
                {(status.water === 'due' || status.water === 'overdue') && (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => void upsertPlant(markWatered(plant))}
                  >
                    Полила
                  </button>
                )}
                {(status.feed === 'due' || status.feed === 'overdue') && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => void upsertPlant(markFed(plant))}
                  >
                    Подкормила
                  </button>
                )}
                {(status.repot === 'due' || status.repot === 'overdue') && (
                  <Link to={`/plant/${plant.id}`} className="btn ghost">
                    Про пересадку
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
