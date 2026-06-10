import { Metadata } from 'next'
import { ContactForm } from '@/components/forms/ContactForm'
import { MapPin, Mail, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us - Workscape Atlas',
  description: 'Get in touch with our team',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-black py-16 text-white md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Get in Touch
            </h1>
            <p className="mt-4 text-gray-300 md:text-xl">
              Have questions about Workscape Atlas? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">
                  Let's Connect
                </h2>
                <p className="mt-4 text-gray-600">
                  Whether you're a coworking space operator looking to improve your digital presence 
                  or a remote worker searching for the perfect workspace, we're here to help.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-gray-600">hello@workscapeatlas.com</p>
                    <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Office</h3>
                    <p className="text-gray-600">San Francisco, CA</p>
                    <p className="text-sm text-gray-500">Remote-first team</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Response Time</h3>
                    <p className="text-gray-600">Monday - Friday</p>
                    <p className="text-sm text-gray-500">9:00 AM - 6:00 PM PST</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-yellow/10 p-6">
                <h3 className="font-semibold text-black">For Space Operators</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Interested in getting your space featured on Workscape Atlas? 
                  Mention "Space Partnership" in your message and we'll prioritize your inquiry.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold">Send us a message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-3xl space-y-8">
            <div>
              <h3 className="text-lg font-semibold">How do I get my coworking space listed?</h3>
              <p className="mt-2 text-gray-600">
                Submit your space through our "Score My Space" form. Our team will review your 
                digital presence and provide recommendations for improvement before featuring your space.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">What is the digital scoring system?</h3>
              <p className="mt-2 text-gray-600">
                Our proprietary scoring system evaluates your website performance, SEO optimization, 
                social media presence, and online reputation to give you a comprehensive digital score.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Is the scoring service free?</h3>
              <p className="mt-2 text-gray-600">
                Yes! We provide a basic digital score analysis at no cost. Premium consulting 
                services are available for spaces looking for detailed improvement strategies.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">How often is the directory updated?</h3>
              <p className="mt-2 text-gray-600">
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