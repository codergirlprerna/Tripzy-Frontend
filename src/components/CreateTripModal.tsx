import { useState, FormEvent, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createTrip, updateTripCoverPhoto } from '@/lib/trips'
import LocationPicker from '@/components/LocationPicker'
import { LocationResult } from '@/lib/geocode'
import { getUserPlan, countOwnedTrips, PLAN_LIMITS } from '@/lib/users'
import { useModalA11y } from '@/hooks/useModalA11y'
import CoverPhotoModal from '@/components/CoverPhotoModal'
import { Camera, X } from 'lucide-react'

const COVER_OPTIONS = [
  { id: 'sunset', gradient: 'linear-gradient(160deg,#ff6ec7,#ffb86b)' },
  { id: 'ocean', gradient: 'linear-gradient(160deg,#6ee7ff,#3ea8c9)' },
  { id: 'forest', gradient: 'linear-gradient(160deg,#c6f24e,#3ea87a)' },
  { id: 'dusk', gradient: 'linear-gradient(160deg,#8f6eff,#ff6ec7)' },
]

type Props = {
  onClose: () => void
}

export default function CreateTripModal({ onClose }: Props) {
  const modalRef = useModalA11y(onClose)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coverColor, setCoverColor] = useState(COVER_OPTIONS[0].gradient)
  const [coverPhotoBlob, setCoverPhotoBlob] = useState<Blob | null>(null)
  const [coverPhotoPreviewUrl, setCoverPhotoPreviewUrl] = useState<string | null>(null)
  const [croppingImageSrc, setCroppingImageSrc] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { currentUser } = useAuth()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCroppingImageSrc(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = '' // allow re-selecting the same file later
  }

  function handleCropConfirm(blob: Blob) {
    if (coverPhotoPreviewUrl) URL.revokeObjectURL(coverPhotoPreviewUrl)
    setCoverPhotoBlob(blob)
    setCoverPhotoPreviewUrl(URL.createObjectURL(blob))
    setCroppingImageSrc(null)
  }

  function handleRemoveCoverPhoto() {
    if (coverPhotoPreviewUrl) URL.revokeObjectURL(coverPhotoPreviewUrl)
    setCoverPhotoBlob(null)
    setCoverPhotoPreviewUrl(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!currentUser) return

    setError('')
    setSubmitting(true)
    try {
      const [plan, ownedTripCount] = await Promise.all([
        getUserPlan(currentUser.uid),
        countOwnedTrips(currentUser.uid),
      ])

      if (ownedTripCount >= PLAN_LIMITS[plan].maxOwnedTrips) {
        setError(
          `You've hit the ${plan === 'free' ? 'Free plan' : 'plan'} limit of ${PLAN_LIMITS[plan].maxOwnedTrips} trips. Upgrade to Crew for unlimited trips.`,
        )
        setSubmitting(false)
        return
      }

      const newTripId = await createTrip(
        {
          ownerId: currentUser.uid,
          title,
          location,
          latitude: locationCoords?.latitude,
          longitude: locationCoords?.longitude,
          description,
          startDate,
          endDate,
          coverColor,
        },
        currentUser.displayName || currentUser.email || 'Someone',
      )

      // Cover photo upload happens AFTER the trip doc exists — it needs a
      // real tripId for the Cloudinary filename and the Firestore update
      // target. If this specific step fails, the trip itself is still
      // created successfully with its gradient cover as a fallback rather
      // than losing the whole trip over a photo upload hiccup.
      if (coverPhotoBlob) {
        try {
          await updateTripCoverPhoto(newTripId, coverPhotoBlob)
        } catch (coverErr) {
          console.warn('Trip created, but cover photo upload failed:', coverErr)
        }
      }

      onClose()
    } catch (err: any) {
      setError(err.message || 'Could not create the trip. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4 py-8">
      <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Create trip" tabIndex={-1} className="modal-card sticker-card max-h-[90vh] w-full max-w-[480px] overflow-y-auto p-7 shadow-hard sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-[22px] font-extrabold">New trip</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-ink text-[16px] font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border-[2px] border-ink bg-pink/20 px-4 py-3 text-[13px] font-semibold text-ink">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
              Trip title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A weekend in Monaco"
              className="w-full rounded-xl border-[2.5px] border-ink px-4 py-3 text-[14.5px] font-medium outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
              Location
            </label>
            <LocationPicker
              placeholder="Interlaken, Switzerland"
              onSelect={(result: LocationResult) => {
                setLocation(result.displayName)
                setLocationCoords({ latitude: result.latitude, longitude: result.longitude })
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
                Start date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border-[2.5px] border-ink px-3 py-3 text-[13.5px] font-medium outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
                End date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border-[2.5px] border-ink px-3 py-3 text-[13.5px] font-medium outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
              Notes (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this trip about?"
              rows={2}
              className="w-full rounded-xl border-[2.5px] border-ink px-4 py-3 text-[14.5px] font-medium outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-wide text-[#4a4460]">
              Cover
            </label>

            {coverPhotoPreviewUrl ? (
              <div className="relative h-24 w-full overflow-hidden rounded-xl border-[2.5px] border-ink">
                <img src={coverPhotoPreviewUrl} alt="Cover preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveCoverPhoto}
                  aria-label="Remove cover photo"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-white"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-3">
                  {COVER_OPTIONS.map((cover) => (
                    <button
                      key={cover.id}
                      type="button"
                      onClick={() => setCoverColor(cover.gradient)}
                      aria-label={`Choose ${cover.id} cover`}
                      className={`h-12 w-12 rounded-xl border-[2.5px] border-ink transition-transform ${
                        coverColor === cover.gradient ? 'scale-110 shadow-hard-sm' : ''
                      }`}
                      style={{ background: cover.gradient }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload your own cover photo"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border-[2.5px] border-dashed border-ink text-[#4a4460]"
                  >
                    <Camera size={18} />
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <p className="mt-2 text-[12px] font-medium text-[#4a4460]">
                  Pick a gradient, or upload your own photo.
                </p>
              </>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full !text-center disabled:opacity-60">
            {submitting ? 'Creating…' : 'Create trip'}
          </button>
        </form>
      </div>

      {croppingImageSrc && (
        <CoverPhotoModal
          imageSrc={croppingImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCroppingImageSrc(null)}
        />
      )}
    </div>
  )
}