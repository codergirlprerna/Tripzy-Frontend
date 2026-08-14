import { useReveal } from '@/hooks/useReveal'
import { Sparkle } from 'lucide-react'

const RECAP_POINTS = [
  'Auto-picked highlight photos, no sorting',
  'Built to post straight to your story',
  'Or keep it private — your call, every time',
]

export default function Recap() {
  const { ref, isVisible } = useReveal<HTMLDivElement>()

  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-8">
        <div
          ref={ref}
          className={`relative overflow-hidden rounded-showcase border-[3px] border-ink bg-ink p-8 text-white transition-all duration-700 sm:p-12 lg:p-[70px] ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(circle at 85% 15%, rgba(255,110,199,0.25), transparent 55%)' }}
          />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-[50px]">
            {/* Copy */}
            <div>
              <span className="mb-4 inline-block rounded-full bg-peach px-3.5 py-1.5 font-mono text-[11.5px] font-bold tracking-wide text-ink">
                THE MOMENT PEOPLE SHARE
              </span>
              <h2 className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-white sm:text-[36px] lg:text-[46px]">
                Every trip ends with a story worth posting.
              </h2>
              <p className="mt-4 max-w-[440px] text-[15px] font-medium leading-relaxed text-white/72 sm:text-[16px]">
                One tap builds a set of recap cards from the trip — the route, the highlights,
                the stats that actually mean something to the people who were there.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {RECAP_POINTS.map((point) => (
                  <li key={point} className="flex gap-3 text-[14px] font-medium text-white/88 sm:text-[14.5px]">
                    <Sparkle size={15} className="mt-0.5 shrink-0 text-peach" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cards: stacked + static on mobile, overlapping + rotated from lg up */}
            <div className="relative flex flex-col gap-5 lg:h-[320px] lg:flex-row lg:gap-0">
              <div
                className="w-full rounded-2xl border-[2.5px] border-white p-5 shadow-hard-white lg:absolute lg:left-[10px] lg:top-0 lg:z-[2] lg:w-[220px] lg:-rotate-6"
                style={{ background: 'linear-gradient(160deg,#ff6ec7,#c94fa0)' }}
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-wide opacity-90">
                  TRIP RECAP
                </span>
                <div className="my-2.5 font-display text-[32px] font-extrabold sm:text-[36px]">07</div>
                <div className="text-[12.5px] font-semibold">cities across 14 days with the crew</div>
              </div>

              <div
                className="w-full rounded-2xl border-[2.5px] border-white p-5 shadow-hard-white lg:absolute lg:right-0 lg:top-[60px] lg:z-[3] lg:w-[220px] lg:rotate-[5deg]"
                style={{ background: 'linear-gradient(160deg,#6ee7ff,#3ea8c9)' }}
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-wide opacity-90">
                  BEST DAY
                </span>
                <div className="my-2.5 font-display text-[32px] font-extrabold sm:text-[36px]">Aug 12</div>
                <div className="text-[12.5px] font-semibold">Interlaken — 23 photos, 4 people</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}