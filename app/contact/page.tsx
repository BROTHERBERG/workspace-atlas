import { Metadata } from 'next'
import { ContactForm } from '@/components/forms/ContactForm'
import { Badge } from '@/components/ui/badge'
import { marketStats } from '@/lib/spaces'
import { MapPin, Mail, Clock, Send } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us - Workscape Atlas',
  description: 'Get in touch with the Workscape Atlas team.',
}

export default function ContactPage() {
  const s = marketStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="border-b-2 border-black bg-[#1f1f1f] text-white">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 py-16 sm:px-6 md:py-24 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-5 inline-flex items-center gap-1.5 bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
              <MapPin className="h-3 w-3" /> {s.marketCount} markets
            </Badge>
            <h1 className="font-cal text-4xl tracking-tight sm:text-5xl md:text-6xl">
              Get in touch
            </h1>
            <p className="mt-4 text-lg text-gray-300">
              Questions about the scan, a listing, or a lead? We read every message.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="font-cal text-3xl tracking-tight sm:text-4xl">
                  Let&apos;s connect
                </h2>
                <p className="mt-4 text-gray-600">
                  Whether you run a coworking space looking to sharpen your digital presence
                  or you&apos;re searching for the right workspace, we&apos;re here to help.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4 rounded-xl border-2 border-black bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-black bg-[#f9cb16]">
                    <Mail className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-cal text-lg">Email</h3>
                    <p className="text-gray-700">hello@workscapeatlas.com</p>
                    <p className="text-sm text-gray-500">We&apos;ll respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border-2 border-black bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-black bg-[#f9cb16]">
                    <MapPin className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-cal text-lg">Based in</h3>
                    <p className="text-gray-700">Calgary, Alberta</p>
                    <p className="text-sm text-gray-500">Mapping the local coworking market</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border-2 border-black bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-black bg-[#f9cb16]">
                    <Clock className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-cal text-lg">Response time</h3>
                    <p className="text-gray-700">Monday – Friday</p>
                    <p className="text-sm text-gray-500">9:00 AM – 6:00 PM MT</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border-2 border-black bg-[#1f1f1f] p-6 text-white shadow-[5px_5px_0px_0px_rgba(249,203,22,1)]">
                <h3 className="font-cal text-lg text-[#f9cb16]">For space operators</h3>
                <p className="mt-2 text-sm text-gray-300">
                  Want your space on Workscape Atlas? We&apos;ve already scored {s.total} spaces across {s.marketCount} markets.
                  Mention &quot;Space Partnership&quot; in your message and we&apos;ll prioritize your inquiry.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-8">
              <h2 className="mb-6 flex items-center gap-2 font-cal text-2xl">
                <Send className="h-5 w-5 text-[#caa406]" /> Send us a message
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-y-2 border-black bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl 2xl:max-w-[110rem] px-4 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 inline-flex items-center gap-1.5 bg-[#f9cb16] text-black hover:bg-[#f9cb16]">
              FAQ
            </Badge>
            <h2 className="font-cal text-3xl tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-black bg-gray-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-cal text-lg">How do I get my coworking space listed?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Submit your space through our &quot;Score My Space&quot; form. Our team will review your
                digital presence and provide recommendations for improvement before featuring your space.
              </p>
            </div>

            <div className="rounded-xl border-2 border-black bg-gray-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-cal text-lg">What is the digital scoring system?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Our proprietary scoring system evaluates your website performance, SEO optimization,
                social media presence, and online reputation to give you a comprehensive digital score.
              </p>
            </div>

            <div className="rounded-xl border-2 border-black bg-gray-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-cal text-lg">Is the scoring service free?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Yes! We provide a basic digital score analysis at no cost. Premium consulting
                services are available for spaces looking for detailed improvement strategies.
              </p>
            </div>

            <div className="rounded-xl border-2 border-black bg-gray-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-cal text-lg">How often is the directory updated?</h3>
              <p className="mt-2 text-sm text-gray-600">
                We continuously update our directory with new spaces and refresh digital scores
                quarterly to ensure accuracy and relevance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
