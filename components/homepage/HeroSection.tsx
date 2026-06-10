import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import Globe from "@/components/globe"

export function HeroSection() {
  return (
    <section className="relative w-full bg-black py-20 md:py-32">
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.png')] bg-repeat opacity-20"></div>
      </div>

      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col justify-center space-y-6 pl-0 md:pl-8 lg:pl-12">
            <div className="space-y-6">
              <Badge className="inline-flex bg-yellow text-black hover:bg-yellow">Now in Beta</Badge>
              <h1 className="font-cal text-4xl tracking-tighter text-white sm:text-6xl xl:text-7xl leading-[0.9] sm:leading-[0.9] xl:leading-[0.9]">
                Find a space. <br />
                Grow your brand. <br />
                <span className="text-yellow">Hire your crew.</span>
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-lg/relaxed xl:text-xl/relaxed text-gray-300 mt-6">
                The first global coworking directory that scores spaces, upgrades them, and connects them with
                leadership talent.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row mt-8">
              <Link
                href="/directory"
                className="inline-flex h-10 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black btn-press"
              >
                Search for a Space
              </Link>
              <Link
                href="/score-my-space"
                className="inline-flex h-10 items-center justify-center rounded-md border-2 border-yellow bg-transparent px-8 text-sm font-medium text-yellow btn-press-yellow"
              >
                Score My Space
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full h-[400px] flex items-center justify-center relative overflow-visible">
              <div className="relative w-full max-w-[500px] h-[500px] flex items-center justify-center">
                {/* Yellow glow behind globe */}
                <div className="absolute inset-0 bg-[#f9cb16] rounded-full opacity-20 blur-3xl"></div>
                <Globe />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}