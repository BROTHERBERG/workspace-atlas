// Hero ticker — real facts from the live scan, pinned above the fold.
import { marketStats, talentLeads } from "@/lib/spaces"

export default function SignalMarquee() {
  const s = marketStats()
  const opening = talentLeads().find((x) => x.hiring.confirmedOpening)
  const items = [
    `${s.total} real coworking spaces mapped`,
    `${s.calgary} in Calgary · ${s.otherAlberta} across Alberta`,
    `Live digital-presence score on every site`,
    `Avg score ${s.avgScore}/100`,
    `${s.webUpgradeCount} with weak or missing web presence`,
    `${s.bandCounts["F"] || 0} scoring F · ${s.bandCounts["A"] || 0} scoring A`,
    `${s.talentCount} operators surfacing hiring signals`,
    opening ? `${opening.name.split("—")[0].trim()} is hiring leadership` : `Live recruitment signals tracked`,
    `Scanned ${s.scored} sites in one pass`,
  ]
  const row = [...items, ...items]
  return (
    <div className="w-full overflow-hidden border-y-2 border-[#f9cb16]/30 bg-black/60 py-3 backdrop-blur-sm">
      <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8 text-sm font-medium text-gray-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#f9cb16]" />
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
