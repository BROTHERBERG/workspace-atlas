import Link from "next/link"

export function CTASection() {
  return (
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
              className="inline-flex h-10 items-center justify-center rounded-md bg-yellow px-8 text-sm font-medium text-black btn-press"
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
  )
}