import { useEffect, useState } from 'react'
import { getQueuedUploads, removeQueuedUpload, getQueuedCount } from '@/lib/offlineQueue'
import { addPhotoEntry, addVoiceEntry } from '@/lib/entries'
import { WifiOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  async function refreshPendingCount() {
    setPendingCount(await getQueuedCount())
  }

  async function syncQueue() {
    if (syncing) return
    setSyncing(true)
    try {
      const items = await getQueuedUploads()
      for (const item of items) {
        try {
          if (item.kind === 'photo') {
            await addPhotoEntry(
              item.tripId,
              item.userId,
              item.userName,
              new File([item.exifSourceBlob || item.blob], item.fileName || 'photo.jpg'),
              item.blob,
              item.fileName || 'photo.jpg',
            )
          } else {
            await addVoiceEntry(item.tripId, item.userId, item.userName, item.blob, item.transcript || '')
          }
          await removeQueuedUpload(item.id)
        } catch {
          // Still failing (maybe connection dropped again mid-sync) — leave it queued, try again next time.
          break
        }
      }
    } finally {
      setSyncing(false)
      refreshPendingCount()
    }
  }

  useEffect(() => {
    refreshPendingCount()

    function handleOnline() {
      setIsOnline(true)
      syncQueue()
    }
    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[300] flex items-center justify-center gap-2 border-b-[2.5px] border-ink px-4 py-2 text-[13px] font-semibold ${
        isOnline ? 'bg-lime' : 'bg-peach'
      }`}
    >
      {!isOnline ? (
        <span className="flex items-center gap-1.5">
          <WifiOff size={14} /> You're offline — new photos and voice notes will queue and send automatically once
          you're back.
        </span>
      ) : syncing ? (
        <span className="flex items-center gap-1.5">
          <Loader2 size={14} className="animate-spin" /> Syncing {pendingCount} queued upload
          {pendingCount === 1 ? '' : 's'}…
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={14} /> Back online — {pendingCount} upload{pendingCount === 1 ? '' : 's'} pending.{' '}
          <button onClick={syncQueue} className="underline">
            Sync now
          </button>
        </span>
      )}
    </div>
  )
}