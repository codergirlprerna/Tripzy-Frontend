const TRUST_ITEMS = [
  '💾 YOUR DATA, EXPORTABLE ANYTIME',
  '📶 WORKS WITH ZERO SIGNAL',
  '👯 BUILT FOR GROUP CHAOS',
]

export default function TrustStrip() {
  return (
    <div className="border-b-[3px] border-ink bg-lime py-[26px]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-3.5 px-8">
        {TRUST_ITEMS.map((item) => (
          <div key={item} className="font-mono text-[12.5px] font-bold text-ink">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}