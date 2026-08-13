import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { enablePushNotifications, getPushPermissionState, subscribeToForegroundPush } from '@/lib/push'
import { Bell } from 'lucide-react'

const DISMISS_KEY = 'tripzy:pushBannerDismissed'

export default function PushNotifications() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [showBanner, setShowBanner] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [toast, setToast] = useState<{ title: string; body: string; tripId?: string } | null>(null)

  useEffect(() => {
    if (!currentUser) return
    const state = getPushPermissionState()
    const dismissed = localStorage.getItem(DISMISS_KEY) === '1'
    setShowBanner(state === 'default' && !dismissed)
  }, [currentUser])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    subscribeToForegroundPush((payload) => {
      setToast(payload)
      setTimeout(() => setToast(null), 6000)
    }).then((unsub) => {
      unsubscribe = unsub
    })
    return () => unsubscribe?.()
  }, [])

  async function handleEnable() {
    if (!currentUser) return
    setRequesting(true)
    const ok = await enablePushNotifications(currentUser.uid)
    setRequesting(false)
    setShowBanner(false)
    if (!ok) localStorage.setItem(DISMISS_KEY, '1') // don't nag again if it failed or was denied
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setShowBanner(false)
  }

  return (
    <>
      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[90] border-t-[3px] border-ink bg-lime px-5 py-3.5 sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-[380px] sm:rounded-2xl sm:border-[2.5px] sm:shadow-hard">
          <div className="flex items-start gap-3">
            <Bell size={20} className="shrink-0" />
            <div className="flex-1">
              <p className="text-[13.5px] font-bold leading-snug">Turn on notifications</p>
              <p className="mt-0.5 text-[12.5px] font-medium text-[#3a3650]">
                Get notified when someone posts a photo or sends a message on your trips.
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={handleEnable}
                  disabled={requesting}
                  className="rounded-full border-2 border-ink bg-ink px-3.5 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-60"
                >
                  {requesting ? 'Enabling…' : 'Enable'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="rounded-full border-2 border-ink bg-white px-3.5 py-1.5 text-[12.5px] font-bold"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <button
          onClick={() => {
            if (toast.tripId) navigate(`/trip/${toast.tripId}`)
            setToast(null)
          }}
          className="sticker-card fixed inset-x-4 top-5 z-[90] p-4 text-left shadow-hard-sm sm:inset-x-auto sm:right-5 sm:w-[300px]"
        >
          <p className="text-[13px] font-bold">{toast.title}</p>
          <p className="mt-0.5 text-[12.5px] font-medium text-[#4a4460]">{toast.body}</p>
        </button>
      )}
    </>
  )
}