import Link from "next/link"
import Image from "next/image"
import { Search, MapPin, ArrowRight, Star, Zap, Users, Building, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import FeaturedSpaces from "@/components/featured-spaces"
import Globe from "@/components/globe"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative w-full bg-black py-20 md:py-32">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute inset-0 bg-[url('/images/grid-pattern.png')] bg-repeat opacity-20"></div>
        </div>

        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-4">
                <Badge className="inline-flex bg-[#f9cb16] text-black hover:bg-[#f9cb16]">Now in Beta</Badge>
                <h1 className="font-cal text-3xl tracking-tighter text-white sm:text-5xl xl:text-6xl/none">
                  Find a space. <br />
                  Grow your brand. <br />
                  <span className="text-[#f9cb16]">Hire your crew.</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-gray-300 mt-6">
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
                  className="inline-flex h-10 items-center justify-center rounded-md border-2 border-[#f9cb16] bg-transparent px-8 text-sm font-medium text-[#f9cb16] btn-press-yellow"
                >
                  Score My Space
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full h-[400px] flex items-center justify-center relative overflow-visible">
                <div className="absolute w-full h-[600px] flex items-center justify-center" style={{ top: "-150px" }}>
                  <Globe />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wavy Divider */}
      <div className="w-full bg-black">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-24">
          <path fill="#ffffff" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>

      {/* Search Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex w-full max-w-[800px] flex-col items-center space-y-4">
            <div className="space-y-4 text-center">
              <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl md:text-5xl">Find Your Perfect Space</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl mt-6">
                Search through thousands of verified coworking spaces worldwide.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2 md:max-w-md lg:max-w-lg">
              <form className="flex w-full max-w-lg items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="City, neighborhood, or space name"
                    className="w-full bg-white pl-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
                <Button type="submit" className="bg-black text-white hover:bg-black/90 btn-press">
                  Search
                </Button>
              </form>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline" className="bg-white hover:bg-gray-100 border-black">
                  <MapPin className="mr-1 h-3 w-3" /> New York
                </Badge>
                <Badge variant="outline" className="bg-white hover:bg-gray-100 border-black">
                  <MapPin className="mr-1 h-3 w-3" /> London
                </Badge>
                <Badge variant="outline" className="bg-white hover:bg-gray-100 border-black">
                  <MapPin className="mr-1 h-3 w-3" /> Berlin
                </Badge>
                <Badge variant="outline" className="bg-white hover:bg-gray-100 border-black">
                  <MapPin className="mr-1 h-3 w-3" /> Singapore
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Spaces */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-4">
              <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl md:text-5xl">Featured Spaces</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl mt-6">
                Discover top-rated coworking spaces with exceptional digital presence.
              </p>
            </div>
          </div>
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 py-8">
            <FeaturedSpaces />
          </div>
          <div className="flex justify-center">
            <Link
              href="/directory"
              className="inline-flex h-10 items-center justify-center rounded-md bg-black px-8 text-sm font-medium text-white btn-press-yellow"
            >
              View All Spaces <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why We Exist */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-4">
                <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl md:text-5xl">Why We Exist</h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-6">
                  We believe the future of work is flexible, connected, and community-driven. Our mission is to elevate
                  the coworking industry through:
                </p>
              </div>
              <div className="space-y-6 mt-8">
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-[3px_3px_0px_0px_rgba(250,204,21,1)]">
                    <Star className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-cal text-xl">Quality Verification</h3>
                    <p className="text-gray-500">We score and verify spaces so you know exactly what you're getting.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-[3px_3px_0px_0px_rgba(250,204,21,1)]">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-cal text-xl">Digital Presence</h3>
                    <p className="text-gray-500">
                      We help spaces improve their online visibility and member experience.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-[3px_3px_0px_0px_rgba(250,204,21,1)]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-cal text-xl">Talent Matching</h3>
                    <p className="text-gray-500">We connect spaces with the right leadership to help them thrive.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-4 border-2 border-dashed border-[#f9cb16] rounded-lg -rotate-2"></div>
                <Image
                  src="/vibrant-coworking-hub.png"
                  alt="Coworking community"
                  width={600}
                  height={600}
                  className="rounded-lg object-cover rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Partners */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-4">
              <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl">Powered By</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl mt-6">
                We've partnered with industry leaders to bring you the best experience.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-[#f9cb16] rounded-full blur-sm"></div>
                    <Building className="h-12 w-12 text-black relative" />
                  </div>
                  <span className="font-cal text-lg">Bottle Rocket Search Group</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-[#f9cb16] rounded-full blur-sm"></div>
                    <Zap className="h-12 w-12 text-black relative" />
                  </div>
                  <span className="font-cal text-lg">Obelisq</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl">What People Are Saying</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Hear from our community of space operators and members.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-[#f9cb16] text-[#f9cb16]" />
                      ))}
                    </div>
                    <p className="text-gray-500">
                      "Workspace Atlas helped us increase our visibility and attract the right members. The digital
                      score was eye-opening."
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-gray-100 p-1 border-2 border-black">
                        <Image
                          src="/confident-professional.png"
                          alt="Sarah Johnson"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <p className="font-cal text-sm">Sarah Johnson</p>
                        <p className="text-xs text-gray-500">Coworking Space Owner</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-[#f9cb16] text-[#f9cb16]" />
                      ))}
                    </div>
                    <p className="text-gray-500">
                      "Finding a reliable coworking space used to be a gamble. With Workspace Atlas, I know exactly what
                      I'm getting."
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-gray-100 p-1 border-2 border-black">
                        <Image
                          src="/confident-businessman.png"
                          alt="Michael Chen"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <p className="font-cal text-sm">Michael Chen</p>
                        <p className="text-xs text-gray-500">Remote Worker</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2 lg:col-span-1 border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-[#f9cb16] text-[#f9cb16]" />
                      ))}
                    </div>
                    <p className="text-gray-500">
                      "As a Community Manager, I found my dream job through Workspace Atlas. The platform connected me
                      with a space that perfectly matched my skills."
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-gray-100 p-1 border-2 border-black">
                        <Image
                          src="/confident-professional.png"
                          alt="Aisha Patel"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <p className="font-cal text-sm">Aisha Patel</p>
                        <p className="text-xs text-gray-500">Community Manager</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Haven Passport Banner */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-[#f9cb16]">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex items-center justify-center">
              <Image
                alt="Haven Passport"
                className="rounded-xl object-contain"
                height="400"
                src="/images/haven-passport.png"
                style={{
                  aspectRatio: "500/400",
                  objectFit: "contain",
                  maxWidth: "80%",
                }}
                width="500"
              />
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-4">
                <Badge className="inline-flex bg-black text-white hover:bg-black/90">New Feature</Badge>
                <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl md:text-5xl">The Haven Passport</h2>
                <p className="max-w-[600px] text-black md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-6">
                  For citizens of the digital frontier. Explore havens. Earn stamps. Unlock your route. Each verified
                  workspace becomes a node in the Network.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row mt-8">
                <Link
                  href="/haven-passport"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-black px-8 text-sm font-medium text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  <Compass className="mr-2 h-4 w-4" /> Explore the Passport
                </Link>
                <Link
                  href="/learn-more"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-black bg-transparent px-8 text-sm font-medium text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-[#1f1f1f] text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-4">
              <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Transform Your Space?
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl mt-6">
                Join the global directory of forward-thinking coworking spaces.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row mt-8">
              <Link
                href="/score-my-space"
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#f9cb16] px-8 text-sm font-medium text-black btn-press"
              >
                Score My Space
              </Link>
              <Link
                href="/directory"
                className="inline-flex h-10 items-center justify-center rounded-md border border-white bg-transparent px-8 text-sm font-medium text-white btn-press-white"
              >
                Explore Spaces
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
