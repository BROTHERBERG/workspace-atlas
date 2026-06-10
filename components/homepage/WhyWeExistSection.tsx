import Image from "next/image"
import { Star, Zap, Users } from "lucide-react"

const REASONS = [
  {
    icon: Star,
    title: "Quality Verification",
    description: "We score and verify spaces so you know exactly what you're getting.",
  },
  {
    icon: Zap,
    title: "Digital Presence",
    description: "We help spaces improve their online visibility and member experience.",
  },
  {
    icon: Users,
    title: "Talent Matching",
    description: "We connect spaces with the right leadership to help them thrive.",
  },
]

export function WhyWeExistSection() {
  return (
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
              {REASONS.map((reason, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-brutalist-yellow">
                    <reason.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-cal text-xl">{reason.title}</h3>
                    <p className="text-gray-500">{reason.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-4 border-2 border-dashed border-yellow rounded-lg -rotate-2"></div>
              <Image
                src="/vibrant-coworking-hub.png"
                alt="Coworking community"
                width={600}
                height={600}
                className="rounded-lg object-cover rotate-2 shadow-brutalist-soft"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}