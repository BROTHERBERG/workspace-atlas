import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Award, Zap, Globe, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import ScoreMySpaceForm from "@/components/score-my-space-form"
import { sortedByScore, allSpaces, bandColor } from "@/lib/spaces"

export default function ScoreMySpacePage() {
  const ranked = sortedByScore(allSpaces().filter((s) => s.digital.score !== null && !s.isChain))
  const examples = [ranked[0], ranked[Math.floor(ranked.length / 2)], ranked[ranked.length - 1]].filter(Boolean)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-black py-16 text-white md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Elevate Your Coworking Space's Digital Presence
                </h1>
                <p className="max-w-[600px] text-gray-300 md:text-xl">
                  Get a comprehensive analysis of your space's online visibility, user experience, and digital
                  engagement.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button className="bg-[#f9cb16] text-black hover:bg-[#f9cb16]">Score My Space Now</Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/digital-analytics-overview.png"
                alt="Digital Score Dashboard"
                width={500}
                height={500}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
            <p className="mt-4 text-gray-500 md:text-xl">
              We render your live site in a real browser and check the five signals that decide whether a member finds —
              and books — your space.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Submit Your Space</h3>
                <p className="mt-2 text-gray-500">
                  Fill out our simple form with your space's details and online presence information.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <BarChart className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Get Your Score</h3>
                <p className="mt-2 text-gray-500">
                  Receive a detailed analysis of your digital presence with actionable insights.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Upgrade Your Presence</h3>
                <p className="mt-2 text-gray-500">
                  Work with our experts to implement improvements and boost your digital score.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Score Factors */}
      <section className="bg-white py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">What We Measure</h2>
                <p className="text-gray-500 md:text-xl">
                  Our comprehensive digital score evaluates multiple factors that impact your online visibility and
                  member acquisition.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Site Speed & Performance</h3>
                    <p className="text-gray-500">
                      We analyze how quickly your website loads and performs across devices.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">SEO Optimization</h3>
                    <p className="text-gray-500">We evaluate how well your site is optimized for search engines.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Mobile User Experience</h3>
                    <p className="text-gray-500">We assess how well your site works on mobile devices.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Social Proof & Reviews</h3>
                    <p className="text-gray-500">We measure your online reputation and member testimonials.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/digital-analytics-overview.png"
                alt="Digital Score Metrics"
                width={500}
                height={500}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Get Your Space Scored</h2>
            <p className="mt-4 text-gray-500 md:text-xl">
              Fill out the form below to receive your comprehensive digital presence analysis.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
            <ScoreMySpaceForm />
          </div>
        </div>
      </section>

      {/* Real examples from the live scan */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How real Calgary spaces score</h2>
            <p className="mt-4 text-gray-500 md:text-xl">
              Pulled live from the market scan — the strongest, the middle, and the one with the most to gain.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {examples.map((space) => {
              const c = bandColor(space.digital.band)
              return (
                <Card key={space.id} className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-md border-2 border-black ${c.bg} text-black`}>
                        <span className="font-cal text-2xl leading-none">{space.digital.band}</span>
                        <span className="text-xs font-bold">{space.digital.score}</span>
                      </div>
                      <div>
                        <p className="font-cal text-lg leading-tight">{space.name.split("—")[0].trim()}</p>
                        <p className="text-sm text-gray-500">{space.neighborhood || space.city}</p>
                      </div>
                    </div>
                    {space.digital.gaps.length > 0 ? (
                      <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-gray-600">
                        {space.digital.gaps.slice(0, 3).map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-emerald-700">Clean across every signal we measure.</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="mt-10 text-center">
            <Link href="/intelligence" className="inline-flex items-center gap-1.5 font-semibold text-black underline hover:text-[#caa406]">
              See every space scored <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-16 text-white md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Boost Your Digital Presence?
            </h2>
            <p className="mt-4 text-gray-300 md:text-xl">
              Get your comprehensive digital score and start attracting more members today.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button className="bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
                Score My Space <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
