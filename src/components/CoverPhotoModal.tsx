import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { getCroppedImageBlob } from '@/lib/cropImage'
import { useModalA11y } from '@/hooks/useModalA11y'
import Spinner from '@/components/Spinner'

type Props = {
  imageSrc: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

// Wide banner ratio — matches the header/card space a cover photo actually
// fills (TripDetailPage's banner, TripCard's top strip), unlike
// PhotoEditorModal's free-form crop which is built for portrait/landscape
// photo entries, not a fixed banner shape.
const COVER_ASPECT = 3

export default function CoverPhotoModal({ imageSrc, onConfirm, onCancel }: Props) {
  const modalRef = useModalA11y(onCancel)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, 0)
      onConfirm(blob)
    } catch {
      setProcessing(false)
    }
  }

  return (
    <div className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4 py-8">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Set trip cover photo"
        tabIndex={-1}
        className="modal-card sticker-card w-full max-w-[560px] p-6 shadow-hard sm:p-7"
      >
        <h2 className="mb-4 font-display text-[18px] font-extrabold">Set cover photo</h2>

        <div className="relative h-[220px] w-full overflow-hidden rounded-xl border-[2.5px] border-ink bg-ink sm:h-[280px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={COVER_ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="mt-4 w-full"
          aria-label="Zoom"
        />

        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !croppedAreaPixels}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {processing ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner /> Saving…
              </span>
            ) : (
              'Use as cover'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}