import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { findSpeciesByName, generalCareProfile, SPECIES_CATALOG } from '../data/plantProfiles'
import { PLANT_LOCATIONS } from '../data/locations'
import { useApp } from '../context/AppContext'
import { identifyPlant, manualIdentify } from '../lib/plantId'
import { compressImageFile } from '../lib/photos'
import type { IdentifyResult, Plant } from '../types'

function uid() {
  return crypto.randomUUID?.() ?? `plant-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function AddPlantPage() {
  const { upsertPlant } = useApp()
  const navigate = useNavigate()
  const [photoDataUrl, setPhotoDataUrl] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [suggestions, setSuggestions] = useState<IdentifyResult[]>([])
  const [selected, setSelected] = useState<IdentifyResult | null>(null)
  const [speciesText, setSpeciesText] = useState('')
  const [name, setName] = useState('')
  const [locationPreset, setLocationPreset] = useState('')
  const [locationCustom, setLocationCustom] = useState('')
  const [notes, setNotes] = useState('')

  const canSave = Boolean(name.trim()) && !busy && !saving

  const manualOptions = useMemo(
    () => SPECIES_CATALOG.filter((s) => s.id !== 'general'),
    [],
  )

  const resolvedLocation = (() => {
    if (locationPreset === 'Другое') return locationCustom.trim() || undefined
    return locationPreset.trim() || undefined
  })()

  async function onPhoto(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(undefined)
    try {
      const dataUrl = await compressImageFile(file)
      setPhotoDataUrl(dataUrl)

      try {
        const { result, error: idError, suggestions: list } = await identifyPlant(file)
        setSuggestions(list)
        if (result) {
          setSelected(result)
          setSpeciesText(result.speciesRu)
          if (!name.trim()) setName(result.speciesRu)
        }
        if (idError) setError(idError)
      } catch {
        setSuggestions([])
        setError('Фото сохранено. Вид можно вписать вручную ниже.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки фото')
    } finally {
      setBusy(false)
    }
  }

  function resolveSpecies(): { species: string; speciesRu: string; careProfile: Plant['careProfile'] } {
    if (selected) {
      return {
        species: selected.species,
        speciesRu: selected.speciesRu,
        careProfile: selected.careProfile,
      }
    }

    const typed = speciesText.trim()
    if (typed) {
      const matched = findSpeciesByName(typed)
      if (matched) {
        return {
          species: matched.species,
          speciesRu: matched.speciesRu,
          careProfile: matched.care,
        }
      }
      return {
        species: typed,
        speciesRu: typed,
        careProfile: generalCareProfile(),
      }
    }

    return {
      species: 'Houseplant',
      speciesRu: 'Комнатное растение',
      careProfile: generalCareProfile(),
    }
  }

  async function onSave() {
    if (!name.trim() || saving) return
    setSaving(true)
    setError(undefined)
    try {
      const resolved = resolveSpecies()
      const now = new Date().toISOString()
      const plant: Plant = {
        id: uid(),
        name: name.trim(),
        species: resolved.species,
        speciesRu: resolved.speciesRu,
        location: resolvedLocation,
        photoDataUrl,
        addedAt: now,
        lastWateredAt: now,
        lastFedAt: now,
        lastRepottedAt: now,
        careProfile: resolved.careProfile,
        notes: notes.trim() || undefined,
      }
      await upsertPlant(plant)
      navigate(`/plant/${plant.id}`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не удалось сохранить'
      setError(
        /quota|недостаточно|space/i.test(message)
          ? 'Не хватает места для фото. Попробуйте другое фото или сохраните без него.'
          : message,
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page">
      <header className="page-hero compact">
        <p className="brand">Цветы</p>
        <h1>Добавить растение</h1>
        <p className="lede">
          Сфотографируйте цветок или просто впишите название — сохранить можно в любом случае.
        </p>
      </header>

      <label className="photo-picker">
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            void onPhoto(file)
          }}
        />
        {photoDataUrl ? (
          <img src={photoDataUrl} alt="Выбранное растение" />
        ) : (
          <span>{busy ? 'Обрабатываем фото…' : 'Нажмите, чтобы сделать фото или выбрать из галереи'}</span>
        )}
      </label>

      {photoDataUrl && (
        <button
          type="button"
          className="btn ghost wide"
          onClick={() => {
            setPhotoDataUrl(undefined)
          }}
        >
          Убрать фото
        </button>
      )}

      {error && <p className="notice">{error}</p>}

      <label className="field">
        <span>Имя в коллекции *</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Роза на кухне"
          autoComplete="off"
        />
      </label>

      <label className="field">
        <span>Какой это цветок (можно написать своими словами)</span>
        <input
          value={speciesText}
          onChange={(e) => {
            const value = e.target.value
            setSpeciesText(value)
            const matched = findSpeciesByName(value)
            if (matched) {
              setSelected({
                species: matched.species,
                speciesRu: matched.speciesRu,
                confidence: 1,
                careProfile: matched.care,
                source: 'manual',
              })
            } else {
              setSelected(null)
            }
          }}
          placeholder="Например: роза, герань, глициния, кактус…"
          autoComplete="off"
          list="species-suggestions"
        />
        <datalist id="species-suggestions">
          {manualOptions.map((o) => (
            <option key={o.id} value={o.speciesRu} />
          ))}
        </datalist>
      </label>

      <label className="field">
        <span>Где стоит растение</span>
        <select
          className="select"
          value={locationPreset}
          onChange={(e) => setLocationPreset(e.target.value)}
        >
          <option value="">Выберите место…</option>
          {PLANT_LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </label>

      {locationPreset === 'Другое' && (
        <label className="field">
          <span>Своё место</span>
          <input
            value={locationCustom}
            onChange={(e) => setLocationCustom(e.target.value)}
            placeholder="Например, у входа во двор"
            autoComplete="off"
          />
        </label>
      )}

      <div className="field-block">
        <h2>Быстрый выбор из списка</h2>
        <select
          className="select"
          value=""
          onChange={(e) => {
            const id = e.target.value
            if (!id) return
            const result = manualIdentify(id)
            setSelected(result)
            setSpeciesText(result.speciesRu)
            if (!name.trim()) setName(result.speciesRu)
          }}
        >
          <option value="">Выберите вид…</option>
          {manualOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.speciesRu}
            </option>
          ))}
        </select>
        {suggestions.length > 0 && (
          <div className="chip-grid" style={{ marginTop: 10 }}>
            {suggestions.map((s) => (
              <button
                key={`${s.species}-${s.source}`}
                type="button"
                className={selected?.species === s.species ? 'chip active' : 'chip'}
                onClick={() => {
                  setSelected(s)
                  setSpeciesText(s.speciesRu)
                  if (!name.trim()) setName(s.speciesRu)
                }}
              >
                {s.speciesRu}
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="field">
        <span>Заметка</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Особенности ухода, что любит…"
        />
      </label>

      <button type="button" className="btn primary wide" disabled={!canSave} onClick={() => void onSave()}>
        {saving ? 'Сохраняем…' : 'Сохранить растение'}
      </button>
      {!name.trim() && <p className="muted">Чтобы сохранить, впишите хотя бы имя в коллекции.</p>}
    </section>
  )
}
