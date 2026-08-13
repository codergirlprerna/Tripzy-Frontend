import { Link } from 'react-router-dom'
import { PartyPopper } from 'lucide-react'

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden py-[70px] pb-[60px]"
      style={{ background: 'linear-gradient(150deg, #ff6ec7 0%, #ffb86b 45%, #6ee7ff 100%)' }}
    >
      <div className="relative z-10 mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-10 px-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-mono text-[11.5px] font-bold text-white">
            <span className="h-[7px] w-[7px] rounded-full bg-lime" />
            BUILT FOR TRIPS WITH MORE THAN ONE PERSON
          </div>

          <h1
            className="font-display text-[40px] font-extrabold leading-[0.96] tracking-tight text-ink sm:text-[56px] lg:text-[74px]"
            style={{ textShadow: '5px 5px 0 rgba(255,255,255,0.55)' }}
          >
            Your trip,
            <br />
            everyone's
            <br />
            story.
          </h1>

          <p className="mt-6 max-w-[460px] text-[18px] font-medium leading-relaxed text-[#28213a]">
            Drop in photos, invite your people, and watch the timeline build itself. When the
            trip's over, Tripzy turns it into a story worth posting — and a bill worth splitting
            fairly.
          </p>

          <div className="mt-9 flex flex-wrap gap-3.5">
            <Link to="/signup" className="btn-primary">
              Start free →
            </Link>
            <a href="#how" className="btn-secondary">
              See how it works
            </a>
          </div>

          <div className="mt-5 font-mono text-[12.5px] font-semibold text-[#3a3150]">
            FREE TO START · NO CARD · WORKS OFFLINE
          </div>
        </div>

        {/* Visual */}
        <div className="relative mx-auto h-[360px] w-full max-w-[380px] sm:h-[400px] lg:h-[440px] lg:max-w-none">
          <div className="absolute left-[6px] top-0 z-[2] w-[190px] -rotate-6 overflow-hidden rounded-2xl border-[2.5px] border-ink shadow-hard sm:w-[230px]">
            <div className="h-[120px] sm:h-[150px]" style={{ background: 'linear-gradient(160deg,#3ec7ea,#8fe8d0)' }} />
            <div className="bg-white p-3.5">
              <div className="font-display text-[13px] font-bold sm:text-[14.5px]">Swiss Alps, together</div>
              <div className="mt-0.5 font-mono text-[9.5px] text-neutral-500 sm:text-[10px]">4 travelers · 62 photos</div>
            </div>
          </div>

          <div className="absolute right-0 top-[48px] z-[3] w-[190px] rotate-[7deg] overflow-hidden rounded-2xl border-[2.5px] border-ink shadow-hard sm:top-[60px] sm:w-[230px]">
            <div className="h-[120px] sm:h-[150px]" style={{ background: 'linear-gradient(160deg,#ffd166,#ff8fb1)' }} />
            <div className="bg-white p-3.5">
              <div className="font-display text-[13px] font-bold sm:text-[14.5px]">Sunrise in Pisa</div>
              <div className="mt-0.5 font-mono text-[9.5px] text-neutral-500 sm:text-[10px]">Solo · 13 min ago</div>
            </div>
          </div>

          <div className="sticker-card absolute left-[40px] top-[205px] z-[4] -rotate-[5deg] px-3.5 py-3 font-display text-[12px] font-extrabold sm:left-[70px] sm:top-[250px] sm:px-[18px] sm:py-4 sm:text-[13.5px]">
            +4 friends
            <br />
            on this trip
          </div>

          <div className="sticker-card absolute bottom-[10px] right-[10px] z-[4] flex items-center gap-1 rotate-[4deg] px-3.5 py-3 font-display text-[12px] font-extrabold sm:right-[30px] sm:px-[18px] sm:py-4 sm:text-[13.5px]">
            split: $0 owed <PartyPopper size={14} />
          </div>
        </div>
      </div>
    </section>
  )
}