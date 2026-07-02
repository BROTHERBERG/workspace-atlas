import { Users, Target, Clock, ShieldCheck, Radar, Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TalentRequestForm } from '@/components/forms/TalentRequestForm'
import { marketStats, MARKET, GENERATED_AT } from '@/lib/spaces'

export const metadata = {
  title: 'Request Talent | Workscape Atlas',
  description: 'Find exceptional leadership for your Calgary coworking space. Tell us who you need and we connect you with matched candidates.',
}

interface RequestTalentPageProps {
  searchParams: Promise<{ space?: string }>
}

const STEPS = [
  {
    icon: Target,
    title: 'Tell us who you need',
    note: 'Describe the role, the space, and what success looks like. Two minutes, no commitment.',
  },
  {
    icon: Users,
    title: 'We match candidates',
    note: 'Your request is routed to Bottle Rocket Search and matched against pre-vetted coworking talent.',
  },
  {
    icon: Clock,
    title: 'Hear back in 48 hours',
    note: 'A real human follows up with matched candidates or a clear next step — not a newsletter.',
  },
]

export default async function RequestTalentPage({ searchParams }: RequestTalentPageProps) {
  const { space } = await searchParams
  const s = marketStats()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b-2 border-black bg-[#1f1f1f] text-white">
        <div className="mx-auto grid max-w-7xl 2xl:max-w-[min(93vw,150rem)] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-10">
          <div className="flex flex-col justify-center">
            <Badge className="mb-4 inline-flex w-fit items-center gap-1.5 bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
              <Radar className="h-3 w-3" /> Routed to Bottle Rocket Search
            </Badge>
            <h1 className="font-cal text-4xl leading-tight tracking-tight sm:text-5xl">
              Find leadership that
              <br />
              grows your space.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-gray-300">
              From General Managers to Community leads — tell us who you need, and we&apos;ll connect you with candidates
              who live the coworking values: community, collaboration, connectivity.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                {MARKET}
              </span>
              <span className="text-white/20">·</span>
              <span>Scanned {GENERATED_AT}</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rounded-xl border-2 border-white/15 bg-black/40 p-6 text-center shadow-[8px_8px_0px_0px_rgba(249,203,22,0.25)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-cal text-4xl text-[#f9cb16]">{s.talentCount}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">Talent leads</div>
                </div>
                <div>
                  <div className="font-cal text-4xl text-emerald-400">{s.liveOpenings}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">Live openings</div>
                </div>
                <div>
                  <div className="font-cal text-4xl text-white">{s.independents}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">Operators tracked</div>
                </div>
                <div>
                  <div className="font-cal text-4xl text-white">{s.cities.length}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">Cities</div>
                </div>
              </div>
              <p className="mt-5 border-t border-white/10 pt-4 text-xs text-gray-400">
                Sourced from the live{' '}
                <span className="text-[#f9cb16]">
                  Workscape<span className="text-[#caa406]"> Atlas</span>
                </span>{' '}
                market scan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b-2 border-black bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl 2xl:max-w-[min(93vw,150rem)] px-4 sm:px-6 lg:px-10">
          <h2 className="font-cal text-3xl tracking-tight">How it works</h2>
          <p className="mt-2 max-w-2xl text-gray-500">
            Three steps from open seat to a warm shortlist — no cold lists, no guesswork.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.title}
                className="rounded-xl border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-black bg-[#f9cb16]/20">
                  <step.icon className="h-5 w-5 text-black" />
                </span>
                <h3 className="mt-4 font-cal text-lg">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{step.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl 2xl:max-w-[min(93vw,150rem)] px-4 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 inline-flex items-center gap-1.5 bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
              <Briefcase className="h-3 w-3" /> Request talent
            </Badge>
            <h2 className="font-cal text-3xl tracking-tight sm:text-4xl">
              {space ? `Hiring for ${space}?` : 'Tell us about the role.'}
            </h2>
            <p className="mt-3 text-gray-500">
              Two minutes to fill out — we&apos;ll take it from there.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-2xl rounded-xl border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-8">
            <TalentRequestForm defaultSpaceName={space} />
          </div>
          <div className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="h-4 w-4 text-[#caa406]" />
            Your request is confidential — we never list your opening publicly without permission.
          </div>
        </div>
      </section>
    </div>
  )
}
