import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Домой', end: true },
  { to: '/today', label: 'Сегодня', end: false },
  { to: '/add', label: 'Добавить', end: false },
  { to: '/shop', label: 'Магазин', end: false },
  { to: '/settings', label: 'Ещё', end: false },
]

export function Layout() {
  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden />
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Основная навигация">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
          >
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
