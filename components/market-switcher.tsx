"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Globe2, ChevronDown } from "lucide-react"
import { markets, ALL_MARKETS } from "@/lib/spaces"

export default function MarketSwitcher({ dark = false }: { dark?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get("market") || ALL_MARKETS
  const list = markets()
  const total = list.reduce((a, m) => a + m.count, 0)

  function pick(m: string) {
    const sp = new URLSearchParams(Array.from(params.entries()))
    if (m === ALL_MARKETS) sp.delete("market")
    else sp.set("market", m)
    const qs = sp.toString()
    router.push(pathname + (qs ? `?${qs}` : ""), { scroll: false })
  }

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 rounded-md border-2 px-2.5 py-1.5 text-sm font-medium ${
        dark ? "border-white/20 bg-white/5 text-white" : "border-black bg-white text-black"
      }`}
    >
      <Globe2 className="h-4 w-4 text-[#caa406]" />
      <select
        aria-label="Select market"
        value={current}
        onChange={(e) => pick(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pr-4 font-medium focus:outline-none"
      >
        <option value={ALL_MARKETS}>All markets · {total}</option>
        {list.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label} · {m.count}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 opacity-60" />
    </div>
  )
}
