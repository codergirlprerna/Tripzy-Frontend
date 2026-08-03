import { Link } from 'react-router-dom'
import { useReveal } from '@/hooks/useReveal'

type Plan = {
  name: string
  desc: string
  price: string
  period: string
  features: string[]
  popular?: boolean
  ctaLabel: string
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    desc: 'Perfect for your first trip',
    price: '$0',
    period: '/forever',
    features: ['Up to 3 active trips', '2 travelers per trip', 'Auto-tagging & timeline', '1 recap export per trip'],
    ctaLabel: 'Get started',
  },
  {
    name: 'Crew',
    desc: 'For friends who travel often',
    price: '$4',
    period: '/month',
    features: [
      'Unlimited trips',
      'Up to 8 travelers per trip',
      'Expense splitting, all currencies',
      'Unlimited recap exports + PDF',
      'Voice-note journaling',
    ],
    popular: true,
    ctaLabel: 'Start free trial',
  },
  {
    name: 'Crew Annual',
    desc: 'Save 20% on the Crew plan',
    price: '$38',
    period: '/year',
    features: ['Everything in Crew', '2 months free', 'Priority sync & storage'],
    ctaLabel: 'Upgrade now',
  },
]

function PlanCard({ plan }: { plan: Plan }) {
  const { ref, isVisible } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={`relative flex flex-col rounded-brand border-[2.5px] border-ink p-7 sm:p-8 transition-all duration-500 ${
        plan.popular ? 'bg-lime shadow-hard' : 'bg-white shadow-hard-sm'
      } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      {plan.popular && (
        <div className="absolute -top-[15px] left-7 rounded-full bg-ink px-3.5 py-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-pink">
          MOST CREWS PICK THIS
        </div>
      )}

      <h3 className="mb-1.5 font-display text-[22px] font-extrabold">{plan.name}</h3>
      <div className="mb-5 min-h-[34px] text-[13.5px] font-semibold text-[#4a4460]">{plan.desc}</div>

      <div className="flex items-baseline gap-1.5 font-display text-[38px] font-extrabold sm:text-[42px]">
        {plan.price}
        <span className="font-sans text-[14px] font-semibold text-[#4a4460]">{plan.period}</span>
      </div>

      <ul className="my-6 flex flex-grow flex-col gap-3">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5 text-[14px] font-semibold text-[#332d47]">
            <span className="font-extrabold text-ink">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <Link
        to="/signup"
        className={`rounded-full border-[2.5px] border-ink px-4 py-3.5 text-center text-[14.5px] font-bold shadow-hard-sm transition-transform duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#161221] ${
          plan.popular ? 'bg-ink text-white' : 'bg-white text-ink'
        }`}
      >
        {plan.ctaLabel}
      </Link>
    </div>
  )
}

export default function Pricing() {
  const { ref: headRef, isVisible: headVisible } = useReveal<HTMLDivElement>()

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-8">
        <div
          ref={headRef}
          className={`mb-12 max-w-[640px] transition-all duration-700 sm:mb-[52px] ${
            headVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <span className="mb-4 inline-block rounded-full bg-ink px-3.5 py-1.5 font-mono text-[11.5px] font-bold tracking-wide text-pink">
            PRICING
          </span>
          <h2 className="font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-[38px] lg:text-[46px]">
            Start free. Upgrade when the trips get bigger.
          </h2>
          <p className="mt-4 text-[15.5px] font-medium leading-relaxed text-[#4a4460] sm:text-[16.5px]">
            No feature paywalled just for having more than one traveler — collaboration is core,
            not an add-on.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-1 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  )
}