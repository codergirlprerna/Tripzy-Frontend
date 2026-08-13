import { HardDrive, WifiOff, Users, LucideIcon } from 'lucide-react'

const TRUST_ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: HardDrive, label: 'YOUR DATA, EXPORTABLE ANYTIME' },
  { icon: WifiOff, label: 'WORKS WITH ZERO SIGNAL' },
  { icon: Users, label: 'BUILT FOR GROUP CHAOS' },
]

export default function TrustStrip() {
  return (
    <div className="border-b-[3px] border-ink bg-lime py-[26px]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-3.5 px-8">
        {TRUST_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 font-mono text-[12.5px] font-bold text-ink">
            <item.icon size={14} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}