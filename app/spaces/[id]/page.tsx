import Link from "next/link"
import { notFound } from "next/navigation"
import {
  MapPin,
  Phone,
  ExternalLink,
  ArrowLeft,
  Wand2,
  Briefcase,
  Users,
  Link2,
  CheckCircle2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import DigitalScoreWidget from "@/components/digital-score-widget"
import ContactForm from "@/components/contact-form"
import { getSpace, allSpaces } from "@/lib/spaces"

export function generateStaticParams() {
  return allSpaces().map((s) => ({ id: String(s.id) }))
}

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const space = getSpace(Number.parseInt(id))
  if (!space) notFound()

  const d = space.digital
  const hostname = space.website ? space.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "") : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b-2 border-black bg-[#1f1f1f] text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
          <Link href="/directory" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#f9cb16]">
            <ArrowLeft className="h-4 w-4" /> Back to directory
          </Link>
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {space.leadWebUpgrade && (
                  <Badge className="border border-orange-400 bg-orange-500/20 text-orange-200 hover:bg-orange-500/20">
                    <Wand2 className="mr-1 h-3 w-3" /> Web-services lead
                  </Badge>
                )}
                {space.hiring.confirmedOpening ? (
                  <Badge className="bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
                    <Briefcase className="mr-1 h-3 w-3" /> Hiring now
                  </Badge>
                ) : space.leadTalent ? (
                  <Badge className="border border-[#f9cb16]/50 bg-[#f9cb16]/15 text-[#f9cb16] hover:bg-[#f9cb16]/15">
                    <Briefcase className="mr-1 h-3 w-3" /> Talent signal
                  </Badge>
                ) : null}
              </div>
              <h1 className="mt-3 font-cal text-3xl tracking-tight sm:text-4xl">{space.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-300">
                <span>{space.operator || "Independent"}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#f9cb16]" />
                  {space.neighborhood ? `${space.neighborhood}, ` : ""}
                  {space.city}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {space.website && (
                <a href={space.website} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#f9cb16] text-black hover:bg-[#ffd83a]">
                    <ExternalLink className="mr-2 h-4 w-4" /> Visit site
                  </Button>
                </a>
              )}
              {space.phone && (
                <a href={`tel:${space.phone}`}>
                  <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                    <Phone className="mr-2 h-4 w-4" /> {space.phone}
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-8 lg:col-span-2">
            {/* Why it's on the radar */}
            {(space.leadWebUpgrade || space.leadTalent) && (
              <div>
                <h2 className="font-cal text-xl">Why this space is on the radar</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {space.leadWebUpgrade && (
                    <div className="rounded-lg border-2 border-black bg-orange-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-orange-600" />
                        <h3 className="font-cal">Web-services opportunity</h3>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {!space.website
                          ? "No website at all — invisible to anyone searching online. A clear pitch for a Crush Digital build."
                          : d.signals.dnsResolves === false
                            ? "Their domain no longer resolves — the site is offline. A rebuild conversation waiting to happen."
                            : "A live but weak site. The fixes below are exactly what a Crush Digital engagement delivers."}
                      </p>
                      {d.gaps.length > 0 && d.signals.reachable && (
                        <ul className="mt-3 list-inside list-disc space-y-0.5 text-sm text-orange-900">
                          {d.gaps.slice(0, 4).map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {space.leadTalent && (
                    <div className="rounded-lg border-2 border-black bg-[#1f1f1f] p-5 text-white shadow-[4px_4px_0px_0px_rgba(249,203,22,1)]">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-[#f9cb16]" />
                        <h3 className="font-cal">Recruitment signal</h3>
                      </div>
                      {space.hiring.confirmedOpening && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#f9cb16]">
                          <CheckCircle2 className="h-4 w-4" /> Live leadership opening detected
                        </p>
                      )}
                      {space.hiring.notes && <p className="mt-2 text-sm text-gray-300">{space.hiring.notes}</p>}
                      {space.hiring.careersUrl && (
                        <a
                          href={space.hiring.careersUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#f9cb16] hover:text-white"
                        >
                          Open careers page <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* What we know */}
            <div>
              <h2 className="font-cal text-xl">What we know</h2>
              <dl className="mt-4 grid gap-px overflow-hidden rounded-lg border-2 border-black bg-black/10 text-sm sm:grid-cols-2">
                {[
                  { k: "Operator", v: space.operator || "Independent" },
                  { k: "Area", v: space.neighborhood || space.city },
                  { k: "Address", v: space.address || "Not published" },
                  { k: "Best for", v: space.targetMember || "General members" },
                  { k: "Website", v: hostname || "None found" },
                  { k: "Type", v: space.isChain ? "National chain location" : "Independent operator" },
                ].map((row) => (
                  <div key={row.k} className="bg-white p-4">
                    <dt className="text-xs uppercase tracking-wide text-gray-400">{row.k}</dt>
                    <dd className="mt-0.5 font-medium text-gray-800">{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Recruitment partner (proposed) */}
            <div>
              <h2 className="font-cal text-xl">Need leadership for this space?</h2>
              <div className="mt-4 rounded-lg border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col items-start gap-5 sm:flex-row">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border-2 border-black bg-[#1f1f1f] text-white">
                    <Users className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-cal text-lg">Bottle Rocket Search Group</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Specialist recruitment for flexible-workspace operators — Community Managers, General Managers and
                      Operations leaders. Talent signals surfaced here route straight to their desk.
                    </p>
                    <Link href="/request-talent" className="mt-3 inline-block">
                      <Button className="border-2 border-black bg-[#f9cb16] text-black hover:bg-[#ffd83a]">
                        Get connected
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Sources */}
            {space.sources.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 font-cal text-xl">
                  <Link2 className="h-5 w-5 text-gray-400" /> Sources
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {space.sources.map((src, i) => (
                    <li key={i}>
                      <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-gray-500 hover:text-[#caa406] hover:underline"
                      >
                        {src}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-gray-400">Scanned {space.scannedAt}. Every figure is sourced — nothing is fabricated.</p>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="space-y-6">
            <DigitalScoreWidget
              score={d.score}
              band={d.band}
              signals={d.signals}
              gaps={d.gaps}
              confidence={d.confidence}
              detailed
            />
            <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="p-6">
                <h2 className="font-cal text-lg">Contact this space</h2>
                <p className="mt-1 text-sm text-gray-500">Reach out through Workscape Atlas.</p>
                <div className="mt-4">
                  <ContactForm />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
