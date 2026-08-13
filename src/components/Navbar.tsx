import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQs', href: '#faq' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-paper/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-[18px] sm:px-8">
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

        <div className="flex items-center gap-3">
          <Link to="/signup" className="btn-primary hidden !px-[22px] !py-[11px] !text-[14px] !shadow-hard-sm md:inline-block">
            Get started
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink md:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t-[2.5px] border-ink bg-paper px-6 py-5 md:hidden">
          <div className="flex flex-col gap-4 text-[15px] font-semibold">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="opacity-80">
                {link.label}
              </a>
            ))}
            <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn-primary mt-1 !text-center">
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}