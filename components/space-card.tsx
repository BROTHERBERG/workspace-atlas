import Link from "next/link"
import { MapPin, ShieldCheck, Smartphone, Share2, CalendarCheck, ExternalLink, Briefcase, Wand2, ImageOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { bandColor, type Space } from "@/lib/spaces"

function Signal({ ok, label, icon: Icon }: { ok: boolean | null; label: string; icon: typeof ShieldCheck }) {
  return (
    <span
      title={`${label}: ${ok ? "yes" : "no"}`}
      className={`flex h-7 w-7 items-center justify-center rounded-md border ${
        ok ? "border-emerald-500/40 bg-emerald-50 text-emerald-600" : "border-gray-200 bg-gray-50 text-gray-300"
      }`}
    >
      <Icon className="h-4 w-4" />
    </span>
  )
}

export default function SpaceCard({ space }: { space: Space }) {
  const c = bandColor(space.digital.band)
  const sig = space.digital.signals
  const scoreText = space.digital.score === null ? "—" : space.digital.score

  // Only show the operator when it actually adds info (not a repeat of the name).
  const opToken = (space.operator?.split(/[\s(—-]/)[0] || "").toLowerCase()
  const showOperator = !!space.operator && !!opToken && !space.name.toLowerCase().includes(opToken)

  return (
    <Card className="flex flex-col overflow-hidden border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
      {/* Header: real screenshot of the operator's live site (or an honest "no site" panel) */}
      <div className="relative h-52 overflow-hidden border-b-2 border-black 2xl:h-60">
        {space.screenshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={space.screenshot} alt={`${space.name} website`} loading="lazy" className="h-full w-full object-cover object-top" />
        ) : (
          <div className={`flex h-full flex-col items-center justify-center ${c.bg} text-black`}>
            <ImageOff className="h-6 w-6 opacity-60" />
            <span className="mt-2 font-cal text-3xl leading-none">{space.digital.band}</span>
            <span className="mt-1 text-xs font-bold uppercase tracking-wide">{!space.website ? "no website" : "site offline"}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2">
          {space.screenshot ? (
            <span className={`inline-flex items-center gap-1.5 rounded-md border-2 border-black px-2 py-1 ${c.bg} text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
              <span className="font-cal text-lg leading-none">{space.digital.band}</span>
              <span className="text-xs font-bold">
                {scoreText}
                <span className="font-medium opacity-70">/100</span>
              </span>
            </span>
          ) : (
            <span />
          )}
          <div className="flex flex-col items-end gap-1">
            {space.leadWebUpgrade && (
              <Badge className="border border-orange-400 bg-orange-500/90 text-white hover:bg-orange-500/90">
                <Wand2 className="mr-1 h-3 w-3" /> Web upgrade
              </Badge>
            )}
            {space.hiring.confirmedOpening ? (
              <Badge className="border border-black bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
                <Briefcase className="mr-1 h-3 w-3" /> Hiring now
              </Badge>
            ) : space.leadTalent ? (
              <Badge className="border border-black bg-white text-black hover:bg-white">
                <Briefcase className="mr-1 h-3 w-3" /> Talent signal
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* Body: name/neighborhood on the left, signal dots pinned right */}
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <MapPin className="h-3 w-3 shrink-0 text-[#caa406]" />
            <span className="truncate">{space.neighborhood || space.city}</span>
          </div>
          <h3 className="mt-1 font-cal text-lg leading-tight">{space.name}</h3>
          {showOperator && <p className="mt-0.5 truncate text-sm text-gray-500">{space.operator}</p>}
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-1.5">
          <Signal ok={sig.https} label="HTTPS" icon={ShieldCheck} />
          <Signal ok={sig.mobileOptimized} label="Mobile-optimized" icon={Smartphone} />
          <Signal ok={(sig.socialCount ?? 0) > 0} label="Social presence" icon={Share2} />
          <Signal ok={sig.onlineBooking} label="Online booking" icon={CalendarCheck} />
        </div>
      </CardContent>

      <CardFooter className="gap-2 p-4 pt-0">
        <Link href={`/spaces/${space.id}`} className="flex-1">
          <Button className="w-full bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(249,203,22,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
            View intel
          </Button>
        </Link>
        {space.website && (
          <a href={space.website} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon" className="border-2 border-black" title="Visit site">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        )}
      </CardFooter>
    </Card>
  )
}
