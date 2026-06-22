import { Metadata } from 'next'
import { MapPin } from 'lucide-react'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { marketStats } from '@/lib/spaces'

export const metadata: Metadata = {
  title: 'Sign Up - Workscape Atlas',
  description: 'Create your Workscape Atlas account',
}

export default function SignUpPage() {
  const s = marketStats()
  return (
    <div className="container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Brand panel — honest, no testimonials */}
      <div className="relative hidden h-full flex-col bg-[#1f1f1f] p-10 text-white lg:flex">
        <div className="relative z-20 flex items-center font-cal text-xl tracking-tight">
          Workscape<span className="text-[#caa406]">&nbsp;Atlas</span>
        </div>
        <div className="relative z-20 mt-auto space-y-6">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-[#f9cb16] px-2.5 py-1 text-xs font-bold text-black">
            <MapPin className="h-3 w-3" /> Calgary &amp; Alberta
          </span>
          <p className="max-w-md font-cal text-3xl leading-[1.1] tracking-tight">
            The coworking market, <span className="text-[#f9cb16]">scored and mapped.</span>
          </p>
          <p className="max-w-md text-sm text-gray-300">
            Every score comes from a real browser rendering the live site — no estimates, no vanity metrics.
          </p>
          <div className="flex gap-8 border-t border-white/10 pt-6">
            <div>
              <div className="font-cal text-3xl text-[#f9cb16]">{s.total}</div>
              <div className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">spaces mapped</div>
            </div>
            <div>
              <div className="font-cal text-3xl text-[#f9cb16]">{s.calgary}</div>
              <div className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">in Calgary</div>
            </div>
            <div>
              <div className="font-cal text-3xl text-[#f9cb16]">{s.scored}</div>
              <div className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">live scans</div>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="mb-2 flex items-center justify-center font-cal text-lg tracking-tight lg:hidden">
              Workscape<span className="text-[#caa406]">&nbsp;Atlas</span>
            </div>
            <h1 className="font-cal text-2xl tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your details to create your account
            </p>
          </div>
          <SignUpForm />
        </div>
      </div>
    </div>
  )
}