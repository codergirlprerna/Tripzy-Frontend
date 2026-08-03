import { Link } from 'react-router-dom'
import { useReveal } from '@/hooks/useReveal'

export default function FinalCta() {
  const { ref, isVisible } = useReveal<HTMLDivElement>()

  return (
    <section
      className="border-y-[3px] border-ink py-20 text-center sm:py-24"
      style={{ background: 'linear-gradient(150deg, #6ee7ff, #ff6ec7)' }}
    >
      <div
        ref={ref}
        className={`mx-auto max-w-[640px] px-6 transition-all duration-700 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <h2
          className="font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-[38px] lg:text-[44px]"
          style={{ textShadow: '5px 5px 0 rgba(255,255,255,0.5)' }}
        >
          Your next trip deserves better than a camera roll.
        </h2>
        <Link to="/signup" className="btn-primary mt-8 inline-block !px-9 !py-[18px] !text-[16.5px]">
          Start your first trip — free
        </Link>
      </div>
    </section>
  )
}