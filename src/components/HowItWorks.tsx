import { useReveal } from '@/hooks/useReveal'

type Phase = {
  tag: string
  title: string
  body: string
  bg?: string
}

const PHASES: Phase[] = [
  {
    tag: "WHILE YOU'RE THERE",
    title: 'Capture',
    body: "Drop in photos and Tripzy auto-tags the date and place from each one. No pins to place by hand, no signal required.",
    bg: 'bg-white',
  },
  {
    tag: 'WITH YOUR CREW',
    title: 'Together',
    body: 'Invite anyone on the trip into a shared journal. Everyone adds photos and notes to the same timeline — and the same bill.',
    bg: 'bg-sky',
  },
  {
    tag: "AFTER YOU'RE BACK",
    title: 'Relive',
    body: "One tap turns the trip into shareable recap cards, a printable PDF, or both. Nothing gets stuck in an app you'll forget to open.",
    bg: 'bg-peach',
  },
]

function PhaseCard({ phase }: { phase: Phase }) {
  const { ref, isVisible } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={`sticker-card shadow-hard p-8 transition-all duration-700 ${phase.bg} ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <span className="mb-[18px] inline-block rounded-full bg-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white">
        {phase.tag}
      </span>
      <h3 className="mb-2.5 font-display text-[22px] font-extrabold">{phase.title}</h3>
      <p className="text-[14.5px] font-medium leading-relaxed text-[#332d47]">{phase.body}</p>
    </div>
  )
}

export default function HowItWorks() {
  const { ref: headRef, isVisible: headVisible } = useReveal<HTMLDivElement>()

  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-[1180px] px-8">
        <div
          ref={headRef}
          className={`mb-[52px] max-w-[640px] transition-all duration-700 ${
            headVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <span className="mb-4 inline-block rounded-full bg-ink px-3.5 py-1.5 font-mono text-[11.5px] font-bold tracking-wide text-pink">
            HOW A TRIP WORKS
          </span>
          <h2 className="font-display text-[30px] font-extrabold leading-tight tracking-tight sm:text-[38px] lg:text-[46px]">
            Three moments, one story.
          </h2>
          <p className="mt-4 text-[16.5px] font-medium leading-relaxed text-[#4a4460]">
            Most journal apps stop at "upload a photo." Tripzy follows the actual shape of a
            trip — capturing it, sharing it, and turning it into something you'll open again.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PHASES.map((phase) => (
            <PhaseCard key={phase.title} phase={phase} />
          ))}
        </div>
      </div>
    </section>
  )
}