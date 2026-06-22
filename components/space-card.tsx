import Link from "next/link"
import { MapPin, ShieldCheck, Smartphone, Share2, CalendarCheck, ExternalLink, Briefcase, Wand2 } from "lucide-react"
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

  return (
    <Card className="flex flex-col overflow-hidden border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
      {/* Score panel replaces the (non-existent) photo — honest + on-brand */}
      <div className="relative flex items-stretch border-b-2 border-black">
        <div className={`flex w-28 shrink-0 flex-col items-center justify-center ${c.bg} text-black`}>
          <span className="font-cal text-4xl leading-none">{space.digital.band}</span>
          <span className="mt-1 text-sm font-bold">{scoreText}<span className="text-xs font-medium opacity-70">/100</span></span>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2 bg-[#1f1f1f] p-3 text-white">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
            <MapPin className="h-3 w-3 text-[#f9cb16]" />
            {space.neighborhood || space.city}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {space.leadWebUpgrade && (
              <Badge className="border border-orange-400 bg-orange-500/20 text-orange-200 hover:bg-orange-500/20">
                <Wand2 className="mr-1 h-3 w-3" /> Web upgrade
              </Badge>
            )}
            {space.hiring.confirmedOpening ? (
              <Badge className="border border-[#f9cb16] bg-[#f9cb16]/20 text-[#f9cb16] hover:bg-[#f9cb16]/20">
                <Briefcase className="mr-1 h-3 w-3" /> Hiring now
              </Badge>
            ) : space.leadTalent ? (
              <Badge className="border border-gray-500 bg-gray-700/40 text-gray-200 hover:bg-gray-700/40">
                <Briefcase className="mr-1 h-3 w-3" /> Talent signal
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <CardContent className="flex-1 p-4">
        <h3 className="font-cal text-lg leading-tight">{space.name}</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          {space.operator || "Independent"} · {space.city}
        </p>
        {space.targetMember && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{space.targetMember}</p>
        )}
        <div className="mt-3 flex gap-1.5">
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
