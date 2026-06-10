import Image from "next/image"
import Link from "next/link"
import { Compass } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function HavenPassportBanner() {
  return (
    <section className="w-full py-12 md:py-16 lg:py-20 bg-yellow">
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
                className="inline-flex h-10 items-center justify-center rounded-md bg-black px-8 text-sm font-medium text-white btn-brutalist"
              >
                <Compass className="mr-2 h-4 w-4" /> Explore the Passport
              </Link>
              <Link
                href="/learn-more"
                className="inline-flex h-10 items-center justify-center rounded-md border border-black bg-transparent px-8 text-sm font-medium text-black btn-brutalist"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}