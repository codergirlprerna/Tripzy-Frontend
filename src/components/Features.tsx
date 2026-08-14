import { useReveal } from '@/hooks/useReveal'
import { MapPin, Users, Wallet, Mic, WifiOff, Unlock, LucideIcon } from 'lucide-react'

type Feature = {
  icon: LucideIcon
  title: string
  body: string
  highlight?: boolean
}

const FEATURES: Feature[] = [
  { icon: MapPin, title: 'Auto-tagged timeline', body: 'Photos land on the map and timeline by themselves, pulled from what\'s already on each shot.' },
  { icon: Users, title: 'Shared trips, real-time', body: 'The one thing most travel journals get wrong: more than one person can document the same trip, live.', highlight: true },
  { icon: Wallet, title: 'Built-in expense split', body: 'Log a cost once, split it your way, in whatever currency it was actually paid in.' },
  { icon: Mic, title: 'Voice-note entries', body: 'Too tired to type at the end of a long day? Talk instead — Tripzy transcribes it into your journal.' },
  { icon: WifiOff, title: 'Works with no signal', body: 'Everything saves locally first and syncs the moment you\'re back online. Remote trips included.' },
  { icon: Unlock, title: 'Your data, always', body: 'Export the raw photos and notes any time, not just a locked PDF. It\'s your trip, not ours.' },
]

function FeatureCard({ feature }: { feature: Feature }) {
  const { ref, isVisible } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={`rounded-2xl border-[2.5px] border-ink p-6 sm:p-7 shadow-hard-sm transition-all duration-500 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard ${
        feature.highlight ? 'bg-ink text-white' : 'bg-white'
      } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      <div
        className={`mb-[18px] flex h-11 w-11 items-center justify-center rounded-xl border-[2.5px] ${
          feature.highlight ? 'border-white/30 bg-white/10' : 'border-ink bg-paper-dim'
        }`}
      >
        <feature.icon size={20} />
      </div>
      <h4 className="mb-2 font-display text-[18px] font-extrabold">{feature.title}</h4>
      <p className={`text-[14px] leading-relaxed font-medium ${feature.highlight ? 'text-white/72' : 'text-[#4a4460]'}`}>
        {feature.body}
      </p>
    </div>
  )
}

export default function Features() {
  const { ref: headRef, isVisible: headVisible } = useReveal<HTMLDivElement>()

  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-8">
        <div
          ref={headRef}
          className={`mb-12 max-w-[640px] transition-all duration-700 sm:mb-[52px] ${
            headVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <span className="mb-4 inline-block rounded-full bg-ink px-3.5 py-1.5 font-mono text-[11.5px] font-bold tracking-wide text-pink">
            WHAT'S INSIDE
          </span>
          <h2 className="font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-[38px] lg:text-[46px]">
            Everything a real trip actually needs.
          </h2>
          <p className="mt-4 text-[15.5px] font-medium leading-relaxed text-[#4a4460] sm:text-[16.5px]">
            Not a booking tool, not another feed — the pieces that make documenting a trip with
            other people less annoying than it currently is.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
}