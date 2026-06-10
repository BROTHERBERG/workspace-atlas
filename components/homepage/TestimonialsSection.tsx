import Image from "next/image"
import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { TESTIMONIALS } from "@/lib/mock-data"

export function TestimonialsSection() {
  return (
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
            {TESTIMONIALS.map((testimonial, index) => (
              <Card 
                key={testimonial.id} 
                className={`card-brutalist ${index === 2 ? "md:col-span-2 lg:col-span-1" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow text-yellow" />
                      ))}
                    </div>
                    <p className="text-gray-500">{testimonial.content}</p>
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-gray-100 p-1 border-2 border-black">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <p className="font-cal text-sm">{testimonial.name}</p>
                        <p className="text-xs text-gray-500">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}