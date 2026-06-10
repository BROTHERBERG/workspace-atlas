import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Users, Building, Briefcase, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import JobListings from "@/components/job-listings"
import TalentProfiles from "@/components/talent-profiles"

export default function RecruitmentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-black py-16 text-white md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Connect with Top Coworking Talent
                </h1>
                <p className="max-w-[600px] text-gray-300 md:text-xl">
                  Find exceptional leadership for your space or discover your next career opportunity in the coworking
                  industry.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild className="bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
                  <Link href="/request-talent">Hire Talent</Link>
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Find a Job
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/collaborative-hub.png"
                alt="Coworking Professionals"
                width={500}
                height={500}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <Tabs defaultValue="jobs" className="w-full">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="jobs">Job Listings</TabsTrigger>
                <TabsTrigger value="talent">Featured Talent</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="jobs" className="mt-8">
              <div className="mx-auto max-w-4xl text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Find Your Next Opportunity</h2>
                <p className="mt-4 text-gray-500 md:text-xl">
                  Browse through leadership positions at top coworking spaces worldwide.
                </p>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center space-x-0 space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <div className="w-full max-w-xs">
                  <Button variant="outline" className="w-full justify-between">
                    All Locations <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full max-w-xs">
                  <Button variant="outline" className="w-full justify-between">
                    All Roles <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full max-w-xs">
                  <Button variant="outline" className="w-full justify-between">
                    All Experience <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-8">
                <JobListings />
              </div>

              <div className="mt-12 text-center">
                <Button>
                  View All Jobs <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="mt-16 rounded-lg border bg-white p-8 shadow-sm">
                <div className="flex flex-col items-center space-y-4 text-center sm:flex-row sm:items-start sm:space-x-8 sm:space-y-0 sm:text-left">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black text-white">
                    <Building className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Looking to Hire?</h3>
                    <p className="text-gray-500">
                      Tell us who you need and we&apos;ll connect you with matched leadership candidates from the
                      coworking industry.
                    </p>
                    <div className="pt-2">
                      <Button asChild>
                        <Link href="/request-talent">Request Talent</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="talent" className="mt-8">
              <div className="mx-auto max-w-4xl text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Featured Talent</h2>
                <p className="mt-4 text-gray-500 md:text-xl">
                  Connect with pre-vetted professionals ready to elevate your coworking space.
                </p>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center space-x-0 space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <div className="w-full max-w-xs">
                  <Button variant="outline" className="w-full justify-between">
                    All Locations <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full max-w-xs">
                  <Button variant="outline" className="w-full justify-between">
                    All Roles <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full max-w-xs">
                  <Button variant="outline" className="w-full justify-between">
                    All Experience <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-8">
                <TalentProfiles />
              </div>

              <div className="mt-12 text-center">
                <Button>
                  View All Talent <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="mt-16 rounded-lg border bg-white p-8 shadow-sm">
                <div className="flex flex-col items-center space-y-4 text-center sm:flex-row sm:items-start sm:space-x-8 sm:space-y-0 sm:text-left">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black text-white">
                    <Users className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Are You a Coworking Professional?</h3>
                    <p className="text-gray-500">
                      Create your profile and get discovered by top coworking spaces looking for talent like you.
                    </p>
                    <div className="pt-2">
                      <Button>Create Profile</Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
            <p className="mt-4 text-gray-500 md:text-xl">
              Our specialized recruitment process connects the right talent with the right spaces.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Specialized Search</h3>
                <p className="mt-2 text-gray-500">
                  We focus exclusively on the coworking and flexible workspace industry.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Vetted Talent</h3>
                <p className="mt-2 text-gray-500">
                  All candidates are pre-screened and evaluated for industry expertise.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Building className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Culture Matching</h3>
                <p className="mt-2 text-gray-500">
                  We ensure candidates align with your space's unique culture and values.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Success Stories</h2>
            <p className="mt-4 text-gray-500 md:text-xl">
              Hear from spaces and professionals who found their perfect match.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gray-100 p-1">
                      <Image
                        src="/confident-professional.png"
                        alt="Sarah Johnson"
                        width={60}
                        height={60}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <p className="font-medium">Sarah Johnson</p>
                      <p className="text-sm text-gray-500">Founder, The Collective</p>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    "Finding the right Community Manager was crucial for our expansion. Through Workscape Atlas, we
                    connected with a professional who not only had the skills we needed but also perfectly aligned with
                    our culture."
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gray-100 p-1">
                      <Image
                        src="/confident-businessman.png"
                        alt="Michael Chen"
                        width={60}
                        height={60}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <p className="font-medium">Michael Chen</p>
                      <p className="text-sm text-gray-500">Community Manager</p>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    "After years in traditional office management, I wanted to transition to the coworking industry.
                    Through the talent matching service, I found a role that leveraged my experience while providing
                    growth opportunities in this exciting field."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partner Highlight */}
      <section className="bg-black py-16 text-white md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Powered by Bottle Rocket Search Group
                </h2>
                <p className="text-gray-300 md:text-xl">
                  Our recruitment services are provided by Bottle Rocket Search Group, specialists in coworking and
                  flexible workspace talent acquisition.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#facc14] text-black">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Industry Expertise</h3>
                    <p className="text-gray-300">Deep understanding of the unique needs of coworking spaces.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#facc14] text-black">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Extensive Network</h3>
                    <p className="text-gray-300">
                      Access to a vast network of qualified professionals in the industry.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#facc14] text-black">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Personalized Approach</h3>
                    <p className="text-gray-300">Tailored recruitment strategies based on your specific needs.</p>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Button className="bg-[#f9cb16] text-black hover:bg-[#f9cb16]">Learn More About Bottle Rocket</Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/collaborative-hiring-strategy.png"
                alt="Bottle Rocket Search Group"
                width={500}
                height={500}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8 shadow-sm">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">Ready to Get Started?</h2>
              <p className="mt-2 text-gray-500">
                Whether you're looking to hire or find your next opportunity, we're here to help.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
                <Button>
                  Post a Job <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline">Create Talent Profile</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
