import Link from "next/link"
import { Compass, MapPin, Globe, Share2, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HavenPassportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative w-full bg-[#facc14] py-20 md:py-32">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute inset-0 bg-[url('/images/grid-pattern.png')] bg-repeat opacity-20"></div>
        </div>

        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <Badge className="inline-flex bg-black text-white hover:bg-black/90">New Feature</Badge>
                <h1 className="font-cal text-3xl tracking-tighter text-black sm:text-5xl xl:text-6xl/none">
                  The Haven <br />
                  Passport <br />
                </h1>
                <p className="max-w-[600px] text-black md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  For citizens of the digital frontier. Explore havens. Earn stamps. Unlock your route. Each verified
                  workspace becomes a node in the Network. A temporary autonomous zone where your creativity flourishes,
                  your presence is scored, and your passport gains power.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-black px-8 text-sm font-medium text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  Get Your Passport
                </Link>
                <Link
                  href="#features"
                  className="inline-flex h-10 items-center justify-center rounded-md border-2 border-black bg-transparent px-8 text-sm font-medium text-black hover:bg-black hover:text-white"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[500px]">
                <div className="relative w-full h-[400px] rounded-lg border-2 border-black overflow-hidden bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="absolute top-0 left-0 w-full h-16 bg-black flex items-center justify-between px-4">
                    <div className="flex items-center">
                      <Compass className="h-6 w-6 text-white mr-2" />
                      <span className="font-cal text-white text-lg">Haven Passport</span>
                    </div>
                    <Badge className="bg-[#facc14] text-black">Voyager</Badge>
                  </div>
                  <div className="absolute top-16 left-0 w-full h-[calc(100%-4rem)] p-6 overflow-auto">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="border-2 border-black rounded-lg p-4 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-xs text-gray-500 mb-1">Havens Visited</div>
                        <div className="font-cal text-lg">8 Spaces</div>
                      </div>
                      <div className="border-2 border-black rounded-lg p-4 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-xs text-gray-500 mb-1">Next Tier</div>
                        <div className="font-cal text-lg">Vanguard</div>
                        <div className="text-xs">4 more havens</div>
                      </div>
                    </div>
                    <div className="border-2 border-black rounded-lg p-4 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4">
                      <div className="text-xs text-gray-500 mb-1">Status Progress</div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-cal text-lg">Voyager</div>
                        <div className="text-sm">65%</div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-black rounded-full" style={{ width: "65%" }}></div>
                      </div>
                    </div>
                    <div className="border-2 border-black rounded-lg p-4 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4">
                      <div className="text-xs text-gray-500 mb-1">Your Route</div>
                      <div className="flex justify-between items-center">
                        <div className="font-cal text-lg">NYC → London → Berlin</div>
                        <Share2 className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="border-2 border-black rounded-lg p-4 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <div className="text-xs text-gray-500 mb-1">Perks Unlocked</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className="bg-[#facc14] text-black">Free Day Pass</Badge>
                        <Badge className="bg-[#facc14] text-black">15% Discount</Badge>
                        <Badge className="bg-[#facc14] text-black">Priority Booking</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-16 bg-black flex items-center justify-around px-4">
                    <Button variant="ghost" className="text-white">
                      <Globe className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" className="text-white">
                      <QrCode className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" className="text-white">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-16 lg:py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl md:text-5xl">Core Features</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                The Haven Passport is your identity in the global network of verified workspaces.
              </p>
            </div>
          </div>

          <Tabs defaultValue="passport" className="mt-8">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="passport" className="font-cal">
                Digital Passport
              </TabsTrigger>
              <TabsTrigger value="booking" className="font-cal">
                Booking System
              </TabsTrigger>
              <TabsTrigger value="status" className="font-cal">
                Status & Perks
              </TabsTrigger>
            </TabsList>
            <TabsContent value="passport" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-cal text-2xl">Your Digital Identity</h3>
                    <p className="text-gray-500">
                      The Haven Passport is your digital identity in the coworking world. Track your journey, showcase
                      your route, and unlock perks as you explore more spaces.
                    </p>
                    <ul className="space-y-2 mt-4">
                      <li className="flex items-start">
                        <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span>Verified Haven Visits (stamped with dates and score)</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span>Status Tier (Nomad, Voyager, Vanguard, Elder)</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span>Perks Unlocked (free day passes, merch, shoutouts)</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span>Referral Code / Invite Link</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span>My Route Map (auto-generated map of all havens visited)</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative w-full max-w-[400px]">
                    <div className="relative w-full h-[300px] rounded-lg border-2 border-black overflow-hidden bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                        <div className="grid grid-cols-3 gap-2 w-full">
                          {[...Array(9)].map((_, i) => (
                            <div
                              key={i}
                              className={`border-2 border-black rounded-lg aspect-square flex items-center justify-center ${i < 5 ? "bg-[#facc14]" : "bg-white"}`}
                            >
                              {i < 5 && <MapPin className="h-6 w-6 text-black" />}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 w-full border-2 border-black rounded-lg p-4 bg-white">
                          <div className="text-xs text-gray-500 mb-1">Your Journey</div>
                          <div className="font-cal text-lg">5/12 Havens Visited</div>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-black rounded-full" style={{ width: "42%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="booking" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-cal text-2xl">Seamless Booking Experience</h3>
                    <p className="text-gray-500">
                      Book day passes, multi-day bundles, or monthly access at participating havens with exclusive perks
                      and discounts based on your status tier.
                    </p>
                    <ul className="space-y-2 mt-4">
                      <li className="flex items-start">
                        <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span>Discounts and perks at participating spaces</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span>Automatic tracking through WorkspaceAtlas</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span>QR code check-in for instant stamp verification</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span>Priority booking at high-demand spaces</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative w-full max-w-[400px]">
                    <div className="relative w-full h-[300px] rounded-lg border-2 border-black overflow-hidden bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <div className="absolute top-0 left-0 w-full h-12 bg-black flex items-center px-4">
                        <span className="font-cal text-white">Book a Space</span>
                      </div>
                      <div className="absolute top-12 left-0 w-full h-[calc(100%-3rem)] p-4 overflow-auto">
                        <div className="border-2 border-black rounded-lg p-3 mb-3 flex justify-between items-center">
                          <div>
                            <div className="font-cal">Day Pass</div>
                            <div className="text-sm text-gray-500">Full access for 1 day</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="line-through text-xs text-gray-500">$30</div>
                            <div className="font-cal">$25.50</div>
                            <Badge className="bg-[#facc14] text-black text-xs">-15%</Badge>
                          </div>
                        </div>
                        <div className="border-2 border-black rounded-lg p-3 mb-3 flex justify-between items-center">
                          <div>
                            <div className="font-cal">5-Day Bundle</div>
                            <div className="text-sm text-gray-500">Valid for 30 days</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="line-through text-xs text-gray-500">$125</div>
                            <div className="font-cal">$100</div>
                            <Badge className="bg-[#facc14] text-black text-xs">-20%</Badge>
                          </div>
                        </div>
                        <div className="border-2 border-black rounded-lg p-3 mb-3 flex justify-between items-center">
                          <div>
                            <div className="font-cal">Monthly Access</div>
                            <div className="text-sm text-gray-500">Unlimited for 30 days</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="line-through text-xs text-gray-500">$300</div>
                            <div className="font-cal">$240</div>
                            <Badge className="bg-[#facc14] text-black text-xs">-20%</Badge>
                          </div>
                        </div>
                        <Button className="w-full bg-[#facc14] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                          Book with Passport
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="status" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-cal text-2xl">Status Tiers & Perks</h3>
                    <p className="text-gray-500">
                      As you explore more havens, your status grows. Each tier unlocks new perks, discounts, and
                      exclusive access to premium features.
                    </p>
                    <div className="space-y-4 mt-4">
                      <div className="border-2 border-black rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <Compass className="h-4 w-4" />
                          </div>
                          <div className="font-cal text-lg">Nomad</div>
                        </div>
                        <div className="text-sm mt-2">1-4 Havens Visited</div>
                        <div className="text-sm mt-1">Perks: Basic stamp collection</div>
                      </div>
                      <div className="border-2 border-black rounded-lg p-4 bg-[#facc14]-50">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-[#facc14] flex items-center justify-center mr-3">
                            <Compass className="h-4 w-4" />
                          </div>
                          <div className="font-cal text-lg">Voyager</div>
                        </div>
                        <div className="text-sm mt-2">5-11 Havens Visited</div>
                        <div className="text-sm mt-1">Perks: 15% off bookings, 1 free day pass/month</div>
                      </div>
                      <div className="border-2 border-black rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <Compass className="h-4 w-4" />
                          </div>
                          <div className="font-cal text-lg">Vanguard</div>
                        </div>
                        <div className="text-sm mt-2">12-24 Havens Visited</div>
                        <div className="text-sm mt-1">
                          Perks: 20% off bookings, 3 free day passes/month, exclusive merch
                        </div>
                      </div>
                      <div className="border-2 border-black rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <Compass className="h-4 w-4" />
                          </div>
                          <div className="font-cal text-lg">Elder</div>
                        </div>
                        <div className="text-sm mt-2">25+ Havens Visited</div>
                        <div className="text-sm mt-1">
                          Perks: 25% off bookings, 5 free day passes/month, premium merch, priority access
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative w-full max-w-[400px]">
                    <div className="relative w-full h-[300px] rounded-lg border-2 border-black overflow-hidden bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                        <div className="w-full border-2 border-black rounded-lg p-4 bg-white mb-4">
                          <div className="text-xs text-gray-500 mb-1">Your Status</div>
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-[#facc14] flex items-center justify-center mr-3">
                              <Compass className="h-4 w-4" />
                            </div>
                            <div className="font-cal text-lg">Voyager</div>
                          </div>
                        </div>
                        <div className="w-full border-2 border-black rounded-lg p-4 bg-white">
                          <div className="text-xs text-gray-500 mb-1">Current Perks</div>
                          <ul className="space-y-2">
                            <li className="flex items-center">
                              <div className="mr-2 h-4 w-4 rounded-full bg-[#facc14] flex items-center justify-center">
                                <span className="text-black font-bold text-xs">✓</span>
                              </div>
                              <span className="text-sm">15% off all bookings</span>
                            </li>
                            <li className="flex items-center">
                              <div className="mr-2 h-4 w-4 rounded-full bg-[#facc14] flex items-center justify-center">
                                <span className="text-black font-bold text-xs">✓</span>
                              </div>
                              <span className="text-sm">1 free day pass per month</span>
                            </li>
                            <li className="flex items-center">
                              <div className="mr-2 h-4 w-4 rounded-full bg-[#facc14] flex items-center justify-center">
                                <span className="text-black font-bold text-xs">✓</span>
                              </div>
                              <span className="text-sm">Route map sharing</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Referral System */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[400px]">
                <div className="relative w-full h-[300px] rounded-lg border-2 border-black overflow-hidden bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="absolute top-0 left-0 w-full h-12 bg-black flex items-center px-4">
                    <span className="font-cal text-white">Referral Program</span>
                  </div>
                  <div className="absolute top-12 left-0 w-full h-[calc(100%-3rem)] p-4 overflow-auto">
                    <div className="border-2 border-black rounded-lg p-3 mb-3">
                      <div className="text-xs text-gray-500 mb-1">Your Referral Code</div>
                      <div className="flex justify-between items-center">
                        <div className="font-cal text-lg">ATLAS-VOYAGER-123</div>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="border-2 border-black rounded-lg p-3 mb-3">
                      <div className="text-xs text-gray-500 mb-1">Referral Stats</div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-cal text-lg">3 Friends Joined</div>
                          <div className="text-sm text-gray-500">+3 Bonus Stamps</div>
                        </div>
                        <Badge className="bg-[#facc14] text-black">+XP</Badge>
                      </div>
                    </div>
                    <div className="border-2 border-black rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Rewards</div>
                      <div className="text-sm">For each friend who joins and books a space:</div>
                      <ul className="text-sm mt-2 space-y-1">
                        <li className="flex items-center">
                          <div className="mr-2 h-3 w-3 rounded-full bg-[#facc14]"></div>
                          <span>You get a bonus stamp</span>
                        </li>
                        <li className="flex items-center">
                          <div className="mr-2 h-3 w-3 rounded-full bg-[#facc14]"></div>
                          <span>They get 10% off their first booking</span>
                        </li>
                        <li className="flex items-center">
                          <div className="mr-2 h-3 w-3 rounded-full bg-[#facc14]"></div>
                          <span>Both earn XP toward next tier</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl">Referral System</h2>
                <p className="text-gray-500">
                  Share your journey with friends and colleagues. When they join the Haven Passport network, both of you
                  earn rewards.
                </p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                      <span className="text-black font-bold text-xs">✓</span>
                    </div>
                    <span>Each passport holder has a unique referral code/link</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                      <span className="text-black font-bold text-xs">✓</span>
                    </div>
                    <span>When a new user signs up and books, both users get bonus stamps</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                      <span className="text-black font-bold text-xs">✓</span>
                    </div>
                    <span>Earn XP toward your next status tier</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 h-5 w-5 rounded-full bg-[#facc14] flex items-center justify-center">
                      <span className="text-black font-bold text-xs">✓</span>
                    </div>
                    <span>Track your referral performance in your passport</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Button className="bg-[#facc14] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                    Get Your Referral Link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl">Membership Options</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Choose the passport tier that fits your coworking journey.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-3">
            <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-cal text-xl">Free</h3>
                    <Badge className="bg-gray-200 text-black">$0</Badge>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span className="text-sm">Stamp collection only</span>
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span className="text-sm">Basic passport profile</span>
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span className="text-sm">Status tier progression</span>
                      </li>
                    </ul>
                  </div>
                  <Button className="mt-4 bg-white text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#facc14] text-black text-xs font-bold py-1 px-3 rounded-full border-2 border-black">
                POPULAR
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-cal text-xl">Pro</h3>
                    <Badge className="bg-[#facc14] text-black">$10/mo</Badge>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span className="text-sm">All Free features</span>
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span className="text-sm">Booking discounts (up to 15%)</span>
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span className="text-sm">Route Map visualization</span>
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-[#facc14] flex items-center justify-center">
                          <span className="text-black font-bold text-xs">✓</span>
                        </div>
                        <span className="text-sm">Referral XP bonuses</span>
                      </li>
                    </ul>
                  </div>
                  <Button className="mt-4 bg-[#facc14] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                    Subscribe
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-cal text-xl">Founder</h3>
                    <Badge className="bg-black text-white">$99/yr</Badge>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-black flex items-center justify-center">
                          <span className="text-white font-bold text-xs">✓</span>
                        </div>
                        <span className="text-sm">All Pro features</span>
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-black flex items-center justify-center">
                          <span className="text-white font-bold text-xs">✓</span>
                        </div>
                        <span className="text-sm">Exclusive merch bundle</span>
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-black flex items-center justify-center">
                          <span className="text-white font-bold text-xs">✓</span>
                        </div>
                        <span className="text-sm">Early access to new spaces</span>
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-4 w-4 rounded-full bg-black flex items-center justify-center">
                          <span className="text-white font-bold text-xs">✓</span>
                        </div>
                        <span className="text-sm">Higher booking discounts (up to 25%)</span>
                      </li>
                    </ul>
                  </div>
                  <Button className="mt-4 bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(250,204,21,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                    Subscribe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-[#facc14] text-black">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl md:text-5xl">Start Your Journey Today</h2>
              <p className="mx-auto max-w-[700px] text-black md:text-xl">
                Your creativity deserves a sanctuary. With the Haven Passport, every check-in, booking, and invitation
                builds your legend. Start your journey, earn your route, and connect with your kind.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-md bg-black px-8 text-sm font-medium text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                Get Your Passport
              </Link>
              <Link
                href="/directory"
                className="inline-flex h-10 items-center justify-center rounded-md border-2 border-black bg-transparent px-8 text-sm font-medium text-black hover:bg-black hover:text-white"
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
