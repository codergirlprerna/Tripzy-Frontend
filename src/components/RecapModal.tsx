import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Trip } from '@/types/trip'
import { Entry } from '@/types/entry'
import { computeRecapStats } from '@/lib/recap'

type Props = {
  trip: Trip
  entries: Entry[]
  onClose: () => void
}

export default function RecapModal({ trip, entries, onClose }: Props) {
  const stats = computeRecapStats(trip, entries)
  const captureRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  async function handleExportPdf() {
    if (!captureRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(captureRef.current, { scale: 2, backgroundColor: '#161221' })
      const imgData = canvas.toDataURL('image/png')

      // Fit the captured card exactly into a single PDF page sized to match its aspect ratio.
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${trip.title.replace(/\s+/g, '-').toLowerCase()}-recap.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 px-4 py-8">
      <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between px-2">
          <h2 className="font-display text-[18px] font-extrabold text-white">Trip recap</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-white/50 text-[16px] font-bold text-white"
          >
            ×
          </button>
        </div>

        {/* This is the element captured into the PDF — keep all visual styling on this node */}
        <div
          ref={captureRef}
          className="relative overflow-hidden rounded-[24px] border-[3px] border-ink p-8 text-white"
          style={{ background: '#161221' }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(circle at 85% 15%, rgba(255,110,199,0.25), transparent 55%)' }}
          />

          <div className="relative">
            <div className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wide text-peach">
              TRIP RECAP
            </div>
            <h3 className="mb-6 font-display text-[26px] font-extrabold leading-tight">{trip.title}</h3>

            <div className="mb-6 grid grid-cols-3 gap-3">
              <StatBlock label="Days" value={stats.dayCount} />
              <StatBlock label="Photos" value={stats.photoCount} />
              <StatBlock label="Crew" value={stats.memberCount} />
            </div>

            {stats.bestDay && (
              <div className="mb-6 rounded-2xl border-[2px] border-white/25 bg-white/5 p-4">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wide text-white/60">
                  BEST DAY
                </div>
                <div className="mt-1 font-display text-[18px] font-extrabold">
                  {stats.bestDay.date} — {stats.bestDay.count} photos
                </div>
              </div>
            )}

            {stats.highlightEntries.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {stats.highlightEntries.map((entry) => (
                  <img
                    key={entry.id}
                    src={entry.mediaUrl}
                    alt=""
                    className="h-[140px] w-full rounded-xl border-[2px] border-white/25 object-cover"
                  />
                ))}
              </div>
            )}

            {stats.photoCount === 0 && (
              <p className="text-[13.5px] font-medium text-white/60">
                Add some photos to this trip to see them in the recap.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="btn-primary mt-5 w-full !text-center disabled:opacity-60"
        >
          {exporting ? 'Exporting…' : 'Download as PDF'}
        </button>
      </div>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border-[2px] border-white/25 bg-white/5 p-3 text-center">
      <div className="font-display text-[26px] font-extrabold">{value}</div>
      <div className="mt-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wide text-white/60">{label}</div>
    </div>
  )
}