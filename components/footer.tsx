import Link from "next/link"
import { Compass, Wand2, Briefcase, MapPin, ArrowUpRight } from "lucide-react"
import { marketStats, GENERATED_AT } from "@/lib/spaces"

export default function Footer() {
  const s = marketStats()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t-2 border-[#f9cb16] bg-[#161616] text-white">
      {/* By the numbers */}
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-10">
          {[
            { n: s.total, l: "spaces mapped" },
            { n: s.avgScore, l: "average score" },
            { n: s.webUpgradeCount, l: "web-services leads" },
            { n: s.talentCount, l: "recruitment leads" },
          ].map((x, i) => (
            <div key={i} className="text-center">
              <div className="font-cal text-3xl text-[#f9cb16]">{x.n}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">{x.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#f9cb16] border-2 border-black">
                <Compass className="h-5 w-5 text-black" />
              </span>
              <span className="font-cal text-2xl">
                Workscape<span className="text-[#caa406]"> Atlas</span>
              </span>
            </div>
            <p className="mt-4 max-w-md text-2xl font-cal leading-snug text-gray-200">
              The whole coworking market, scored on real signals — sorted into the two pipelines that can act on it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-sm text-orange-300">
                <Wand2 className="h-3.5 w-3.5" /> Web-services leads
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f9cb16]/40 bg-[#f9cb16]/10 px-3 py-1 text-sm text-[#f9cb16]">
                <Briefcase className="h-3.5 w-3.5" /> Recruitment leads
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-cal text-sm uppercase tracking-wide text-gray-400">Explore</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/directory", label: "Directory" },
                { href: "/intelligence", label: "Intelligence map" },
                { href: "/score-my-space", label: "Score My Space" },
                { href: "/recruitment", label: "Recruitment" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-300 transition-colors hover:text-[#f9cb16]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-cal text-sm uppercase tracking-wide text-gray-400">The scan</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Live · scanned {GENERATED_AT}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#f9cb16]" /> Calgary &amp; Alberta
              </li>
              <li>
                <Link
                  href="/intelligence#web-upgrade"
                  className="inline-flex items-center gap-1 text-gray-300 hover:text-[#f9cb16]"
                >
                  Methodology &amp; limits <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Finale — oversized wordmark */}
        <div className="mt-16 border-t border-white/10 pt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gray-500">
            re-runs in minutes · re-points at any market
          </p>
          <div className="mt-3 select-none overflow-hidden whitespace-nowrap leading-[0.82]">
            <span className="font-cal tracking-tight text-white" style={{ fontSize: "clamp(2.75rem, 11vw, 8rem)" }}>
              Workscape<span className="text-[#f9cb16]">&nbsp;Atlas</span>
            </span>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-sm text-gray-400 sm:flex-row">
          <p>
            © {year} <span className="text-gray-200">Crush Digital Atelier</span> · Workscape Atlas
          </p>
          <p className="text-xs">A real market scan — built to be re-run, not mocked up.</p>
        </div>
      </div>
    </footer>
  )
}
