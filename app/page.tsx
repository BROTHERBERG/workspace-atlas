import Link from "next/link"
import { ArrowRight } from "lucide-react"
import FeaturedSpaces from "@/components/featured-spaces"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { HeroSection } from "@/components/homepage/HeroSection"
import { SearchSection } from "@/components/homepage/SearchSection"
import { WhyWeExistSection } from "@/components/homepage/WhyWeExistSection"
import { PartnersSection } from "@/components/homepage/PartnersSection"
import { TestimonialsSection } from "@/components/homepage/TestimonialsSection"
import { HavenPassportBanner } from "@/components/homepage/HavenPassportBanner"
import { CTASection } from "@/components/homepage/CTASection"
import TrendingWorkspaces from "@/components/recommendations/TrendingWorkspaces"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <ErrorBoundary>
        <HeroSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <SearchSection />
      </ErrorBoundary>

      {/* Featured Spaces */}
      <ErrorBoundary>
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
      </ErrorBoundary>

      {/* Trending Workspaces - Commented out until database is populated */}
      {/* <ErrorBoundary>
        <section className="w-full py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6">
            <TrendingWorkspaces count={8} />
          </div>
        </section>
      </ErrorBoundary> */}

      <ErrorBoundary>
        <WhyWeExistSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <PartnersSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <TestimonialsSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <HavenPassportBanner />
      </ErrorBoundary>

      <ErrorBoundary>
        <CTASection />
      </ErrorBoundary>
    </div>
  )
}
