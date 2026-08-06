const DB_NAME = 'tripzy-offline'
const STORE_NAME = 'pending-uploads'

export type QueuedUpload = {
  id: string
  kind: 'photo' | 'voice'
  tripId: string
  userId: string
  userName: string
  blob: Blob
  exifSourceBlob?: Blob // only for photos — the original, unedited file, for EXIF reading
  fileName?: string
  transcript?: string // only for voice notes
  queuedAt: number
}

function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function enqueueUpload(item: Omit<QueuedUpload, 'id' | 'queuedAt'>): Promise<void> {
  const db = await openQueueDb()
  const queued: QueuedUpload = { ...item, id: crypto.randomUUID(), queuedAt: Date.now() }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(queued)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getQueuedUploads(): Promise<QueuedUpload[]> {
  const db = await openQueueDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function removeQueuedUpload(id: string): Promise<void> {
  const db = await openQueueDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getQueuedCount(): Promise<number> {
  const items = await getQueuedUploads()
  return items.length
}