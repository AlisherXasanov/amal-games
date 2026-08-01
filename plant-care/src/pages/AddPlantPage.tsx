import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SPECIES_CATALOG } from '../data/plantProfiles'
import { useApp } from '../context/AppContext'
import { fileToDataUrl, identifyPlant, manualIdentify } from '../lib/plantId'
import type { IdentifyResult, Plant } from '../types'

function uid() {
  return crypto.randomUUID()
}

export function AddPlantPage() {
  const { upsertPlant } = useApp()
  const navigate = useNavigate()
  const [photoDataUrl, setPhotoDataUrl] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [suggestions, setSuggestions] = useState<IdentifyResult[]>([])
  const [selected, setSelected] = useState<IdentifyResult | null>(null)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  const canSave = Boolean(selected && name.trim())

  const manualOptions = useMemo(() => SPECIES_CATALOG, [])

  async function onPhoto(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(undefined)
    try {
      const dataUrl = await fileToDataUrl(file)
      setPhotoDataUrl(dataUrl)
      const { result, error: idError, suggestions: list } = await identifyPlant(file)
      setSuggestions(list)
      if (result) {
        setSelected(result)
        setName(result.speciesRu)
      } else if (list[0]) {
        setSelected(null)
      }
      if (idError) setError(idError)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки фото')
    } finally {
      setBusy(false)
    }
  }

  async function onSave() {
    if (!selected || !name.trim()) return
    const now = new Date().toISOString()
    const plant: Plant = {
      id: uid(),
      name: name.trim(),
      species: selected.species,
      speciesRu: selected.speciesRu,
      photoDataUrl,
      addedAt: now,
      lastWateredAt: now,
      lastFedAt: now,
      lastRepottedAt: now,
      careProfile: selected.careProfile,
      notes: notes.trim() || undefined,
    }
    await upsertPlant(plant)
    navigate(`/plant/${plant.id}`)
  }

  return (
    <section className="page">
      <header className="page-hero compact">
        <p className="brand">Цветы</p>
        <h1>Добавить растение</h1>
        <p className="lede">Сфотографируйте цветок — попробуем определить вид и настроить уход.</p>
      </header>

      <label className="photo-picker">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => void onPhoto(e.target.files?.[0])}
        />
        {photoDataUrl ? (
          <img src={photoDataUrl} alt="Выбранное растение" />
        ) : (
          <span>{busy ? 'Распознаём…' : 'Нажмите, чтобы сделать фото или выбрать из галереи'}</span>
        )}
      </label>

      {error && <p className="notice">{error}</p>}

      {(suggestions.length > 0 || selected) && (
        <div className="field-block">
          <h2>Вид растения</h2>
          {selected?.source === 'plant.id' && (
            <p className="muted">
              Распознано: {selected.speciesRu} ({Math.round(selected.confidence * 100)}%)
            </p>
          )}
          <div className="chip-grid">
            {(selected?.source === 'plant.id' ? [selected, ...suggestions] : suggestions).map((s) => (
              <button
                key={`${s.species}-${s.source}`}
                type="button"
                className={selected?.species === s.species ? 'chip active' : 'chip'}
                onClick={() => {
                  setSelected(s)
                  if (!name) setName(s.speciesRu)
                }}
              >
                {s.speciesRu}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field-block">
        <h2>Или выбрать вручную</h2>
        <select
          className="select"
          value=""
          onChange={(e) => {
            const id = e.target.value
            if (!id) return
            const result = manualIdentify(id)
            setSelected(result)
            setName(result.speciesRu)
          }}
        >
          <option value="">Список распространённых видов…</option>
          {manualOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.speciesRu}
            </option>
          ))}
        </select>
      </div>

      <label className="field">
        <span>Имя в коллекции</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Монстера у окна" />
      </label>

      <label className="field">
        <span>Заметка</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Где стоит, особенности…" />
      </label>

      <button type="button" className="btn primary wide" disabled={!canSave || busy} onClick={() => void onSave()}>
        Сохранить растение
      </button>
    </section>
  )
}
