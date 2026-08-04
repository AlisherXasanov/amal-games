import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Plant } from '../types'

interface PlantCareDB extends DBSchema {
  plants: {
    key: string
    value: Plant
    indexes: { 'by-added': string }
  }
}

const DB_NAME = 'plant-care-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<PlantCareDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<PlantCareDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('plants', { keyPath: 'id' })
        store.createIndex('by-added', 'addedAt')
      },
    })
  }
  return dbPromise
}

export async function listPlants(): Promise<Plant[]> {
  const db = await getDb()
  const plants = await db.getAllFromIndex('plants', 'by-added')
  return plants.reverse()
}

export async function getPlant(id: string): Promise<Plant | undefined> {
  const db = await getDb()
  return db.get('plants', id)
}

export async function savePlant(plant: Plant): Promise<void> {
  const db = await getDb()
  await db.put('plants', plant)
}

export async function deletePlant(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('plants', id)
}
