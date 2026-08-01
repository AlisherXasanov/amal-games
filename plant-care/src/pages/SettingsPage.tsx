import { useState } from 'react'
import { useApp } from '../context/AppContext'

export function SettingsPage() {
  const { settings, updateSettings, refreshClimate, climate } = useApp()
  const [apiKey, setApiKey] = useState(settings.plantIdApiKey)
  const [cityLabel, setCityLabel] = useState(settings.cityLabel)
  const [useGeo, setUseGeo] = useState(settings.useGeolocation)
  const [saved, setSaved] = useState(false)

  function onSave() {
    updateSettings({
      ...settings,
      plantIdApiKey: apiKey.trim(),
      cityLabel: cityLabel.trim() || 'Москва',
      useGeolocation: useGeo,
    })
    setSaved(true)
    void refreshClimate()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="page">
      <header className="page-hero compact">
        <p className="brand">Цветы</p>
        <h1>Настройки</h1>
        <p className="lede">Климат, распознавание по фото и установка на iPhone.</p>
      </header>

      <div className="field-block install-card">
        <h2>Добавить на экран «Домой»</h2>
        <ol className="install-steps">
          <li>Откройте сайт в Safari на iPhone.</li>
          <li>Нажмите кнопку «Поделиться».</li>
          <li>Выберите «На экран Домой».</li>
          <li>Подтвердите имя «Цветы» — приложение откроется без строки Safari.</li>
        </ol>
      </div>

      <label className="field">
        <span>Город (подпись)</span>
        <input value={cityLabel} onChange={(e) => setCityLabel(e.target.value)} />
      </label>

      <label className="check-row">
        <input type="checkbox" checked={useGeo} onChange={(e) => setUseGeo(e.target.checked)} />
        <span>Использовать геолокацию для погоды</span>
      </label>

      {climate && (
        <p className="muted">
          Сейчас: {climate.cityLabel}, {Math.round(climate.temperatureC)}°C, влажность{' '}
          {Math.round(climate.humidity)}%
        </p>
      )}

      <label className="field">
        <span>API-ключ Plant.id (распознавание по фото)</span>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Вставьте ключ с plant.id"
          autoComplete="off"
        />
      </label>
      <p className="muted">
        Без ключа можно выбирать вид вручную из списка. Ключ хранится только на этом телефоне.
      </p>

      <button type="button" className="btn primary wide" onClick={onSave}>
        {saved ? 'Сохранено' : 'Сохранить настройки'}
      </button>

      <div className="field-block">
        <h2>О приложении</h2>
        <p className="muted">
          Локальный помощник по поливу, подкормке и пересадке. Данные растений хранятся в браузере
          этого устройства. Позже можно обернуть в нативное iOS-приложение через Capacitor.
        </p>
      </div>
    </section>
  )
}
