import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { shopRecommendations, marketSearchUrls } from '../lib/shop'
import { itemsForCategory } from '../data/shopCatalog'
import type { ShopItem } from '../types'

export function ShopPage() {
  const { plants } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const plantId = params.get('plant')
  const plant = plants.find((p) => p.id === plantId) ?? plants[0]

  const items: ShopItem[] = useMemo(() => {
    if (!plant) return []
    const recommended = shopRecommendations(plant)
    const rest = itemsForCategory(plant.careProfile.category).filter(
      (i) => !recommended.some((r) => r.id === i.id),
    )
    return [...recommended, ...rest]
  }, [plant])

  return (
    <section className="page">
      <header className="page-hero compact">
        <p className="brand">Цветы</p>
        <h1>Магазин ухода</h1>
        <p className="lede">
          Подберём удобрения, грунт и горшок — и откроем поиск на маркетплейсах.
        </p>
      </header>

      {plants.length === 0 ? (
        <div className="empty-state">
          <p>Сначала добавьте растение — тогда появятся точные рекомендации.</p>
          <Link to="/add" className="btn primary">
            Добавить растение
          </Link>
        </div>
      ) : (
        <>
          <label className="field">
            <span>Растение</span>
            <select
              className="select"
              value={plant?.id}
              onChange={(e) => navigate(`/shop?plant=${e.target.value}`, { replace: true })}
            >
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.speciesRu}
                </option>
              ))}
            </select>
          </label>

          <ul className="shop-list">
            {items.map((item) => (
              <li key={item.id} className="shop-item reveal">
                <div>
                  <span className="kind-tag">{kindLabel(item.kind)}</span>
                  <strong>{item.title}</strong>
                  <p className="muted">{item.reason}</p>
                </div>
                <div className="market-links">
                  {marketSearchUrls(item.query).map((m) => (
                    <a key={m.name} href={m.url} target="_blank" rel="noreferrer" className="btn ghost small">
                      {m.name}
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function kindLabel(kind: ShopItem['kind']) {
  switch (kind) {
    case 'fertilizer':
      return 'Подкормка'
    case 'soil':
      return 'Грунт'
    case 'pot':
      return 'Горшок'
    default:
      return 'Ещё'
  }
}
