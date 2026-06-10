import { Building, Zap } from "lucide-react"
import { PARTNERS } from "@/lib/mock-data"

const ICON_MAP = {
  Building,
  Zap,
} as const

export function PartnersSection() {
  return (
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
            {PARTNERS.map((partner) => {
              const IconComponent = ICON_MAP[partner.icon as keyof typeof ICON_MAP]
              return (
                <div key={partner.id} className="flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-yellow rounded-full blur-sm"></div>
                      <IconComponent className="h-12 w-12 text-black relative" />
                    </div>
                    <span className="font-cal text-lg">{partner.name}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}