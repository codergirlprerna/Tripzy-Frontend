import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQs', href: '#faq' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-paper/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-8 py-[18px]">
        <a href="#top" className="flex items-center gap-2 font-display text-[26px] font-extrabold tracking-tight">
          <span
            className="inline-block h-[30px] w-[30px] -rotate-[8deg] rounded-[9px] border-[2.5px] border-ink"
            style={{ background: 'linear-gradient(135deg, #ff6ec7, #ffb86b)' }}
          />
          tripzy
        </a>

        <div className="hidden gap-9 text-[15px] font-semibold md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="opacity-75 transition-opacity hover:opacity-100">
              {link.label}
            </a>
          ))}
        </div>

        <Link to="/signup" className="btn-primary !px-[22px] !py-[11px] !text-[14px] !shadow-hard-sm">
          Get started
        </Link>
      </nav>
    </header>
  )
}