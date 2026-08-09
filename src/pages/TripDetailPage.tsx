import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getTrip, subscribeToTripEntries, addPhotoEntry, addVoiceEntry } from '@/lib/entries'
import { enqueueUpload } from '@/lib/offlineQueue'
import { subscribeToTripExpenses } from '@/lib/expenses'
import { subscribeToItinerary } from '@/lib/itinerary'
import { Trip } from '@/types/trip'
import { Entry } from '@/types/entry'
import { Expense } from '@/types/expense'
import { ItineraryItem } from '@/types/itinerary'
import EntryCard from '@/components/EntryCard'
import VoiceEntryCard from '@/components/VoiceEntryCard'
import VoiceRecorderModal from '@/components/VoiceRecorderModal'
import RecapModal from '@/components/RecapModal'
import TripMap from '@/components/TripMap'
import ExpensesView from '@/components/ExpensesView'
import AddExpenseModal from '@/components/AddExpenseModal'
import ChatPanel from '@/components/ChatPanel'
import WeatherWidget from '@/components/WeatherWidget'
import TripCountdown from '@/components/TripCountdown'
import MembersModal from '@/components/MembersModal'
import PhotoEditorModal from '@/components/PhotoEditorModal'
import DestinationGuideModal from '@/components/DestinationGuideModal'
import NotificationBell from '@/components/NotificationBell'
import AIStoryModal from '@/components/AIStoryModal'
import DeleteTripModal from '@/components/DeleteTripModal'
import ItineraryView from '@/components/ItineraryView'
import AddItineraryItemModal from '@/components/AddItineraryItemModal'

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showRecap, setShowRecap] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showAIStory, setShowAIStory] = useState(false)
  const [showDeleteTrip, setShowDeleteTrip] = useState(false)
  const [showAddItinerary, setShowAddItinerary] = useState(false)
  const [editingItineraryItem, setEditingItineraryItem] = useState<ItineraryItem | null>(null)
  const [view, setView] = useState<'photos' | 'map' | 'expenses' | 'chat' | 'itinerary'>('photos')
  const [editQueue, setEditQueue] = useState<File[]>([])
  const [editIndex, setEditIndex] = useState(0)
  const [editImageSrc, setEditImageSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tripId) return

    getTrip(tripId).then((data) => {
      setTrip(data)
      setLoading(false)
    })

    const unsubscribeEntries = subscribeToTripEntries(tripId, setEntries)
    const unsubscribeExpenses = subscribeToTripExpenses(tripId, setExpenses)
    const unsubscribeItinerary = subscribeToItinerary(tripId, setItineraryItems)
    return () => {
      unsubscribeEntries()
      unsubscribeExpenses()
      unsubscribeItinerary()
    }
  }, [tripId])

  function handleCopyInvite() {
    if (!trip) return
    const link = `${window.location.origin}/join/${trip.id}/${trip.inviteCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileList = Array.from(files)
    setEditQueue(fileList)
    setEditIndex(0)
    setEditImageSrc(URL.createObjectURL(fileList[0]))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadEditedPhoto(blob: Blob) {
    if (!tripId || !currentUser) return
    const originalFile = editQueue[editIndex]
    const userName = currentUser.displayName || currentUser.email || 'Someone'

    setUploading(true)
    setUploadError('')
    try {
      if (!navigator.onLine) {
        await enqueueUpload({
          kind: 'photo',
          tripId,
          userId: currentUser.uid,
          userName,
          blob,
          exifSourceBlob: originalFile,
          fileName: originalFile.name,
        })
      } else {
        await addPhotoEntry(tripId, currentUser.uid, userName, originalFile, blob, originalFile.name)
      }
    } catch (err: any) {
      // Could genuinely be a dropped connection, but could also be a permission
      // error, a misconfigured upload preset, or something else entirely — queue
      // it either way so the photo isn't lost, but be honest about which happened
      // rather than always blaming "connection issue" when the real cause might
      // be a bug worth noticing and fixing, not just retrying.
      const isLikelyNetworkIssue = !navigator.onLine || err?.message?.toLowerCase().includes('network')

      try {
        await enqueueUpload({
          kind: 'photo',
          tripId,
          userId: currentUser.uid,
          userName,
          blob,
          exifSourceBlob: originalFile,
          fileName: originalFile.name,
        })
        setUploadError(
          isLikelyNetworkIssue
            ? "Connection issue — this photo has been queued and will send automatically once you're back online."
            : `Upload failed (${err.message || 'unknown error'}) — queued to retry. If this keeps happening, it's likely a bug, not a connection issue.`,
        )
      } catch {
        setUploadError(err.message || 'Upload failed for one photo. Continuing with the rest.')
      }
    } finally {
      setUploading(false)
      advanceEditQueue()
    }
  }

  function advanceEditQueue() {
    if (editImageSrc) URL.revokeObjectURL(editImageSrc)

    const nextIndex = editIndex + 1
    if (nextIndex >= editQueue.length) {
      setEditQueue([])
      setEditIndex(0)
      setEditImageSrc(null)
      return
    }

    setEditIndex(nextIndex)
    setEditImageSrc(URL.createObjectURL(editQueue[nextIndex]))
  }

  function cancelEditQueue() {
    if (editImageSrc) URL.revokeObjectURL(editImageSrc)
    setEditQueue([])
    setEditIndex(0)
    setEditImageSrc(null)
  }

  async function handleSaveVoiceNote(audioBlob: Blob, transcript: string) {
    if (!tripId || !currentUser) return
    const userName = currentUser.displayName || currentUser.email || 'Someone'

    try {
      if (!navigator.onLine) {
        await enqueueUpload({ kind: 'voice', tripId, userId: currentUser.uid, userName, blob: audioBlob, transcript })
      } else {
        await addVoiceEntry(tripId, currentUser.uid, userName, audioBlob, transcript)
      }
    } catch {
      await enqueueUpload({ kind: 'voice', tripId, userId: currentUser.uid, userName, blob: audioBlob, transcript })
    } finally {
      setShowVoiceRecorder(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-[14px] font-semibold">Loading…</div>
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-[15px] font-semibold">Trip not found.</p>
        <Link to="/dashboard" className="btn-secondary !px-5 !py-3 !text-[14px]">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const myRole = currentUser ? trip.members[currentUser.uid]?.role : undefined
  const canEdit = myRole === 'owner' || myRole === 'editor'
  const isOwner = myRole === 'owner'

  return (
    <div className="min-h-screen bg-paper">
      <div className="h-[220px]" style={{ background: trip.coverColor }} />

      <div className="mx-auto max-w-[1180px] px-8">
        <div className="-mt-10 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="sticker-card bg-white px-6 py-5 shadow-hard-sm">
            <button onClick={() => navigate('/dashboard')} className="mb-2 text-[12px] font-bold text-[#4a4460]">
              ← Back to trips
            </button>
            <h1 className="font-display text-[26px] font-extrabold">{trip.title}</h1>
            <div className="mt-1 text-[14px] font-medium text-[#4a4460]">
              📍 {trip.location} · {trip.startDate} → {trip.endDate}
            </div>
            {trip.description && (
              <p className="mt-2 max-w-[500px] text-[13.5px] font-medium text-[#4a4460]">{trip.description}</p>
            )}
            <button
              onClick={() => setShowMembers(true)}
              className="mt-2 font-mono text-[11px] font-semibold text-[#7a7590] underline"
            >
              👯 {trip.memberIds.length} {trip.memberIds.length === 1 ? 'person' : 'people'} on this trip
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              <TripCountdown startDate={trip.startDate} endDate={trip.endDate} />
              <WeatherWidget latitude={trip.latitude} longitude={trip.longitude} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <NotificationBell tripId={trip.id} />
            <button onClick={() => setShowGuide(true)} className="btn-secondary !px-4 !py-3 !text-[14px]">
              🧭 Tripzy Guide
            </button>
            <button onClick={() => setShowAIStory(true)} className="btn-secondary !px-4 !py-3 !text-[14px]">
              ✨ AI story
            </button>
            <button onClick={handleCopyInvite} className="btn-secondary !px-5 !py-3 !text-[14px]">
              {copied ? 'Link copied!' : '+ Invite'}
            </button>
            <button onClick={() => setShowRecap(true)} className="btn-secondary !px-5 !py-3 !text-[14px]">
              View recap
            </button>
            {isOwner && (
              <button
                onClick={() => setShowDeleteTrip(true)}
                aria-label="Delete trip"
                title="Delete trip"
                className="rounded-full border-[2.5px] border-ink !px-4 !py-3 text-[14px] font-bold text-[#c0325f] shadow-hard-sm transition-transform duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                🗑️
              </button>
            )}
            {canEdit && (
              <>
                <button onClick={() => setShowVoiceRecorder(true)} className="btn-secondary !px-4 !py-3 !text-[14px]">
                  🎤 Voice note
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className={`btn-primary inline-block cursor-pointer !px-5 !py-3 !text-[14px] ${
                    uploading ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {uploading ? 'Uploading…' : '+ Add photos'}
                </label>
              </>
            )}
          </div>
        </div>

        {uploadError && (
          <div className="mb-6 rounded-xl border-[2px] border-ink bg-pink/20 px-4 py-3 text-[13px] font-semibold text-ink">
            {uploadError}
          </div>
        )}

        <div className="pb-16">
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-full border-[2.5px] border-ink bg-white p-1">
            <button
              onClick={() => setView('photos')}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                view === 'photos' ? 'bg-ink text-white' : 'text-ink'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setView('map')}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                view === 'map' ? 'bg-ink text-white' : 'text-ink'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setView('expenses')}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                view === 'expenses' ? 'bg-ink text-white' : 'text-ink'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setView('itinerary')}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                view === 'itinerary' ? 'bg-ink text-white' : 'text-ink'
              }`}
            >
              Itinerary
            </button>
            <button
              onClick={() => setView('chat')}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                view === 'chat' ? 'bg-ink text-white' : 'text-ink'
              }`}
            >
              Chat
            </button>
          </div>

          {view === 'expenses' && canEdit && (
            <div className="mb-6 flex justify-end">
              <button onClick={() => setShowAddExpense(true)} className="btn-primary !px-5 !py-3 !text-[14px]">
                + Add expense
              </button>
            </div>
          )}

          {view === 'itinerary' && canEdit && (
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => {
                  setEditingItineraryItem(null)
                  setShowAddItinerary(true)
                }}
                className="btn-primary !px-5 !py-3 !text-[14px]"
              >
                + Add plan
              </button>
            </div>
          )}

          {view === 'photos' ? (
            entries.length === 0 ? (
              <div className="py-16 text-center text-[14.5px] font-medium text-[#4a4460]">
                No photos yet — add some to start building the timeline.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {entries.map((entry) =>
                  entry.type === 'voice' ? (
                    <VoiceEntryCard key={entry.id} entry={entry} />
                  ) : (
                    <EntryCard key={entry.id} entry={entry} />
                  ),
                )}
              </div>
            )
          ) : view === 'map' ? (
            <TripMap entries={entries} />
          ) : view === 'expenses' ? (
            <ExpensesView trip={trip} expenses={expenses} />
          ) : view === 'itinerary' ? (
            <ItineraryView
              trip={trip}
              items={itineraryItems}
              canEdit={canEdit}
              onEditItem={(item) => {
                setEditingItineraryItem(item)
                setShowAddItinerary(true)
              }}
            />
          ) : (
            <ChatPanel tripId={trip.id} />
          )}
        </div>
      </div>

      {showRecap && <RecapModal trip={trip} entries={entries} onClose={() => setShowRecap(false)} />}
      {showAddExpense && <AddExpenseModal trip={trip} onClose={() => setShowAddExpense(false)} />}
      {showMembers && <MembersModal trip={trip} onClose={() => setShowMembers(false)} />}
      {showGuide && <DestinationGuideModal location={trip.location} onClose={() => setShowGuide(false)} />}
      {showAIStory && <AIStoryModal trip={trip} entries={entries} onClose={() => setShowAIStory(false)} />}
      {showAddItinerary && (
        <AddItineraryItemModal
          trip={trip}
          editingItem={editingItineraryItem}
          defaultDay={trip.startDate}
          onClose={() => {
            setShowAddItinerary(false)
            setEditingItineraryItem(null)
          }}
        />
      )}
      {showDeleteTrip && (
        <DeleteTripModal
          trip={trip}
          onClose={() => setShowDeleteTrip(false)}
          onDeleted={() => navigate('/dashboard')}
        />
      )}
      {showVoiceRecorder && (
        <VoiceRecorderModal onSave={handleSaveVoiceNote} onClose={() => setShowVoiceRecorder(false)} />
      )}
      {editImageSrc && (
        <PhotoEditorModal
          imageSrc={editImageSrc}
          fileName={editQueue[editIndex]?.name || ''}
          currentIndex={editIndex}
          totalCount={editQueue.length}
          onConfirm={uploadEditedPhoto}
          onSkip={advanceEditQueue}
          onCancelAll={cancelEditQueue}
        />
      )}
    </div>
  )
}