import { useState } from 'react'
import { useReveal } from '@/hooks/useReveal'

const FAQS = [
  {
    q: 'Can more than one person really edit the same trip?',
    a: 'Yes — invite anyone on the trip and they can add photos, notes, and expenses to the same shared journal in real time. This is the thing most travel journal apps don\'t do.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'You can export every photo and note as a raw archive at any time, on any plan. Cancelling never locks your memories behind a paywall.',
  },
  {
    q: 'Does it work without internet?',
    a: 'Yes. Photos, notes, and voice entries save to your device first and sync automatically once you\'re back online — built for remote trips with patchy signal.',
  },
  {
    q: 'How does expense splitting handle different currencies?',
    a: 'Log an expense in whatever currency you paid in — Tripzy converts and splits it fairly across the crew, so nobody\'s doing mental math at checkout.',
  },
]

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border-[2.5px] border-ink bg-white shadow-hard-sm">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left font-bold text-[15px] text-ink sm:px-6 sm:text-[15.5px]"
      >
        {q}
        <span
          className={`flex-shrink-0 font-mono text-xl font-extrabold text-pink transition-transform duration-300 ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen ? '200px' : '0px' }}
      >
        <div className="px-5 pb-5 text-[14px] font-medium leading-relaxed text-[#4a4460] sm:px-6 sm:text-[14.5px]">
          {a}
        </div>
      </div>
    </div>
  )
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const { ref: headRef, isVisible: headVisible } = useReveal<HTMLDivElement>()

  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-8">
        <div
          ref={headRef}
          className={`mb-12 max-w-[640px] transition-all duration-700 sm:mb-[52px] ${
            headVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <span className="mb-4 inline-block rounded-full bg-ink px-3.5 py-1.5 font-mono text-[11.5px] font-bold tracking-wide text-pink">
            QUESTIONS
          </span>
          <h2 className="font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-[38px] lg:text-[46px]">
            Frequently asked.
          </h2>
        </div>

        <div className="flex max-w-[760px] flex-col gap-3.5">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={faq.q}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}