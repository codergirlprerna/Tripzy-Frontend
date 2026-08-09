import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { subscribeToTripActivity, getLastSeen, markSeen, ActivityItem } from '@/lib/notifications'

const KIND_ICON: Record<ActivityItem['kind'], string> = {
  photo: '📸',
  voice: '🎤',
  message: '💬',
  expense: '💸',
}

function timeAgo(ts: number): string {
  const diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (diffSec < 60) return 'just now'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.round(diffHr / 24)}d ago`
}

export default function NotificationBell({ tripId }: { tripId: string }) {
  const { currentUser } = useAuth()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [lastSeen, setLastSeen] = useState(() => getLastSeen(tripId))
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = subscribeToTripActivity(tripId, setItems)
    return unsubscribe
  }, [tripId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const others = items.filter((i) => i.actorId !== currentUser?.uid)
  const unreadCount = others.filter((i) => i.createdAt > lastSeen).length

  function handleToggle() {
    const next = !open
    setOpen(next)
    if (next) {
      markSeen(tripId)
      setLastSeen(Date.now())
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        aria-label="Trip activity"
        className="btn-secondary relative !px-4 !py-3 !text-[16px]"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-pink px-1 font-mono text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="sticker-card fixed inset-x-4 top-[76px] z-50 max-h-[380px] overflow-y-auto p-3 shadow-hard-sm sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[300px]">
          <div className="mb-2 px-1 font-mono text-[10.5px] font-semibold text-[#a39fb0]">
            Live while this tab's open
          </div>
          {others.length === 0 ? (
            <div className="py-8 text-center text-[13px] font-medium text-[#7a7590]">
              No activity yet — updates from the crew will show up here.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {others.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="flex items-start gap-2.5 rounded-xl px-2 py-2 hover:bg-paper-dim">
                  <span className="text-[15px]">{KIND_ICON[item.kind]}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-snug text-ink">
                      <span className="font-bold">{item.actorName}</span> {item.summary}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] font-semibold text-[#a39fb0]">{timeAgo(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}