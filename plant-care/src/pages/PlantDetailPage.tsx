import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { careTips, getPlantStatus, markFed, markRepotted, markWatered } from '../lib/care'
import { CATEGORY_LABELS } from '../data/plantProfiles'
import { shopRecommendations, marketSearchUrls } from '../lib/shop'
import { StatusBadge } from '../components/StatusBadge'

export function PlantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { plants, climate, upsertPlant, removePlant } = useApp()
  const plant = plants.find((p) => p.id === id)

  if (!plant) {
    return (
      <section className="page">
        <p>Растение не найдено.</p>
        <Link to="/" className="btn ghost">
          Назад
        </Link>
      </section>
    )
  }

  const status = getPlantStatus(plant, climate ?? undefined)
  const tips = careTips(plant, climate ?? undefined)
  const shop = shopRecommendations(plant)

  return (
    <section className="page detail-page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        ← Назад
      </button>

      <div className="detail-hero">
        {plant.photoDataUrl ? (
          <img src={plant.photoDataUrl} alt={plant.name} className="detail-photo" />
        ) : (
          <div className="detail-photo placeholder" />
        )}
        <div className="detail-title">
          <p className="brand">Цветы</p>
          <h1>{plant.name}</h1>
          <p className="lede">
            {plant.speciesRu} · {CATEGORY_LABELS[plant.careProfile.category]}
          </p>
        </div>
      </div>

      <div className="status-grid">
        <div>
          <StatusBadge urgency={status.water} />
          <p>{status.waterLabel}</p>
        </div>
        <div>
          <StatusBadge urgency={status.feed} />
          <p>{status.feedLabel}</p>
        </div>
        <div>
          <StatusBadge urgency={status.repot} />
          <p>{status.repotLabel}</p>
        </div>
      </div>

      <div className="task-actions wrap">
        <button type="button" className="btn primary" onClick={() => void upsertPlant(markWatered(plant))}>
          Полила
        </button>
        <button type="button" className="btn secondary" onClick={() => void upsertPlant(markFed(plant))}>
          Подкормила
        </button>
        <button type="button" className="btn ghost" onClick={() => void upsertPlant(markRepotted(plant))}>
          Пересадила
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => void upsertPlant({ ...plant, needsRepotFlag: true })}
        >
          Нужна пересадка
        </button>
      </div>

      <div className="field-block">
        <h2>Советы сейчас</h2>
        <ul className="tips">
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="field-block">
        <h2>Пересадка и грунт</h2>
        <p>
          Рекомендуемый грунт: <strong>{plant.careProfile.soilType}</strong>. Интервал пересадки — около{' '}
          {plant.careProfile.repotIntervalMonths} мес. Лучшее время — весна и начало лета.
        </p>
        {(status.repot === 'due' || status.repot === 'overdue' || plant.needsRepotFlag) && (
          <p className="notice">
            Сейчас стоит планировать пересадку: новый горшок чуть шире, свежий грунт и слой дренажа на дне.
          </p>
        )}
      </div>

      <div className="field-block">
        <h2>Что купить</h2>
        <p className="muted">Подкормка: {plant.careProfile.fertilizerType}</p>
        <ul className="shop-list">
          {shop.map((item) => (
            <li key={item.id} className="shop-item">
              <div>
                <strong>{item.title}</strong>
                <p className="muted">{item.reason}</p>
              </div>
              <div className="market-links">
                {marketSearchUrls(item.query).map((m) => (
                  <a key={m.name} href={m.url} target="_blank" rel="noreferrer" className="text-link">
                    {m.name}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <Link to={`/shop?plant=${plant.id}`} className="btn ghost wide">
          Все товары для этого растения
        </Link>
      </div>

      {plant.notes && (
        <div className="field-block">
          <h2>Заметка</h2>
          <p>{plant.notes}</p>
        </div>
      )}

      <button
        type="button"
        className="btn danger wide"
        onClick={() => {
          if (confirm('Удалить растение из коллекции?')) {
            void removePlant(plant.id).then(() => navigate('/'))
          }
        }}
      >
        Удалить растение
      </button>
    </section>
  )
}
