const PRODUCT_LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
]

const COMPANY_LINKS = [
  { label: 'About', href: '#' },
  { label: 'Support', href: '#' },
  { label: 'FAQs', href: '#faq' },
]

const FOLLOW_LINKS = [
  { label: 'Instagram', href: '#' },
  { label: 'TikTok', href: '#' },
]

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h5 className="mb-3.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white/50">
        {title}
      </h5>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className="mb-2.5 block text-[14px] font-medium text-white/78 transition-colors hover:text-peach"
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="bg-ink px-6 py-[54px] text-white/70 sm:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col gap-8 border-b border-white/[0.14] pb-9 sm:flex-row sm:justify-between sm:gap-7">
          <div>
            <div className="font-display text-[22px] font-extrabold text-white">tripzy</div>
            <p className="mt-2.5 max-w-[260px] text-[13.5px] text-white/55">
              The travel journal built for trips with more than one person in them.
            </p>
          </div>

          <div className="flex flex-wrap gap-10 sm:gap-12">
            <FooterColumn title="PRODUCT" links={PRODUCT_LINKS} />
            <FooterColumn title="COMPANY" links={COMPANY_LINKS} />
            <FooterColumn title="FOLLOW" links={FOLLOW_LINKS} />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-6 text-[12.5px] text-white/45 sm:flex-row sm:justify-between">
          <span>© 2026 Tripzy. All rights reserved.</span>
          <span>Made for travelers who don't go alone.</span>
        </div>
      </div>
    </footer>
  )
}