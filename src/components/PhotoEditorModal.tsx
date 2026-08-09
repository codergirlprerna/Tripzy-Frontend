import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { getCroppedImageBlob } from '@/lib/cropImage'
import Spinner from '@/components/Spinner'

type Props = {
  imageSrc: string
  fileName: string
  currentIndex: number
  totalCount: number
  onConfirm: (blob: Blob) => void
  onSkip: () => void
  onCancelAll: () => void
}

export default function PhotoEditorModal({
  imageSrc,
  fileName,
  currentIndex,
  totalCount,
  onConfirm,
  onSkip,
  onCancelAll,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [cropArea, setCropArea] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCropArea(areaPixels)
  }, [])

  async function handleConfirm() {
    if (!cropArea) return
    setProcessing(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, cropArea, rotation)
      onConfirm(blob)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-ink">
      <div className="flex items-center justify-between border-b-[2.5px] border-white/20 px-5 py-4">
        <button onClick={onCancelAll} className="text-[13px] font-bold text-white/70">
          Cancel
        </button>
        <div className="font-mono text-[12px] font-semibold text-white/70">
          Editing {currentIndex + 1} of {totalCount} — {fileName}
        </div>
        <div className="w-[52px]" />
      </div>

      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={undefined}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={handleCropComplete}
        />
      </div>

      <div className="flex flex-col gap-3 border-t-[2.5px] border-white/20 bg-ink px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold text-white/70">ZOOM</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-pink"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold text-white/70">ROTATE</span>
          <input
            type="range"
            min={-180}
            max={180}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="flex-1 accent-pink"
          />
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="rounded-lg border-2 border-white/40 px-2 py-1 text-[13px] font-bold text-white"
            title="Rotate 90°"
          >
            ⟳ 90°
          </button>
        </div>

        <div className="mt-2 flex gap-3">
          <button onClick={onSkip} className="btn-secondary flex-1 !bg-transparent !text-white">
            Skip this photo
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {processing ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner /> Processing…
              </span>
            ) : (
              'Use photo'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}