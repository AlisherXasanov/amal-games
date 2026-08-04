import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { deletePlant, listPlants, savePlant } from '../lib/db'
import { fetchClimate } from '../lib/climate'
import { loadSettings, saveSettings } from '../lib/settings'
import type { AppSettings, ClimateSnapshot, Plant } from '../types'

interface AppContextValue {
  plants: Plant[]
  loading: boolean
  climate: ClimateSnapshot | null
  climateError: string | null
  settings: AppSettings
  refreshPlants: () => Promise<void>
  refreshClimate: () => Promise<void>
  upsertPlant: (plant: Plant) => Promise<void>
  removePlant: (id: string) => Promise<void>
  updateSettings: (next: AppSettings) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [climate, setClimate] = useState<ClimateSnapshot | null>(null)
  const [climateError, setClimateError] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())

  const refreshPlants = useCallback(async () => {
    const all = await listPlants()
    setPlants(all)
  }, [])

  const refreshClimate = useCallback(async () => {
    try {
      setClimateError(null)
      const snap = await fetchClimate()
      setClimate(snap)
    } catch (e) {
      setClimateError(e instanceof Error ? e.message : 'Нет данных о погоде')
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        await refreshPlants()
      } finally {
        setLoading(false)
      }
      void refreshClimate()
    })()
  }, [refreshPlants, refreshClimate])

  const upsertPlant = useCallback(
    async (plant: Plant) => {
      try {
        await savePlant(plant)
      } catch (error) {
        // Retry once without photo if storage quota is exceeded
        const message = error instanceof Error ? error.message : String(error)
        if (plant.photoDataUrl && /quota|exceeded|недостаточно/i.test(message)) {
          await savePlant({ ...plant, photoDataUrl: undefined })
          await refreshPlants()
          throw new Error('Растение сохранено без фото: не хватило места в телефоне.')
        }
        throw error instanceof Error ? error : new Error('Не удалось сохранить растение')
      }
      await refreshPlants()
    },
    [refreshPlants],
  )

  const removePlant = useCallback(
    async (id: string) => {
      await deletePlant(id)
      await refreshPlants()
    },
    [refreshPlants],
  )

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next)
    saveSettings(next)
  }, [])

  const value = useMemo(
    () => ({
      plants,
      loading,
      climate,
      climateError,
      settings,
      refreshPlants,
      refreshClimate,
      upsertPlant,
      removePlant,
      updateSettings,
    }),
    [
      plants,
      loading,
      climate,
      climateError,
      settings,
      refreshPlants,
      refreshClimate,
      upsertPlant,
      removePlant,
      updateSettings,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
