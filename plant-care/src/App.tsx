import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AppProvider } from './context/AppContext'
import { AddPlantPage } from './pages/AddPlantPage'
import { HomePage } from './pages/HomePage'
import { PlantDetailPage } from './pages/PlantDetailPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShopPage } from './pages/ShopPage'
import { TodayPage } from './pages/TodayPage'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="today" element={<TodayPage />} />
            <Route path="add" element={<AddPlantPage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="plant/:id" element={<PlantDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
