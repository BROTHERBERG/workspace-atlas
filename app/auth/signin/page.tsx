import { Metadata } from 'next'
import { MapPin, ShieldCheck } from 'lucide-react'
import { SignInForm } from '@/components/auth/SignInForm'
import { marketStats } from '@/lib/spaces'

export const metadata: Metadata = {
  title: 'Sign In - Workscape Atlas',
  description: 'Sign in to your Workscape Atlas account',
}

export default function SignInPage() {
  const s = marketStats()

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-stretch lg:grid lg:grid-cols-2">
      {/* Brand panel — honest, no fabricated testimonial */}
      <div className="relative hidden flex-col justify-between bg-[#1f1f1f] p-10 text-white lg:flex">
        {/* yellow accent rail */}
        <div className="absolute inset-y-0 right-0 w-1.5 bg-[#f9cb16]" />

        <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-[#f9cb16] bg-[#f9cb16]/15">
            <MapPin className="h-4 w-4 text-[#f9cb16]" />
          </span>
          <span className="font-cal text-xl tracking-tight">
            Workscape<span className="text-[#caa406]"> Atlas</span>
          </span>
        </div>

        <div className="relative z-20">
          <p className="font-cal text-3xl leading-[1.1] tracking-tight xl:text-4xl">
            Real coworking market intelligence —{' '}
            <span className="text-[#f9cb16]">every space scored, every lead sourced.</span>
          </p>
          <div className="mt-8 inline-flex items-center gap-4 rounded-lg border-2 border-white/15 bg-black/40 px-5 py-4">
            <div className="text-center">
              <div className="font-cal text-3xl text-[#f9cb16]">{s.total}</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">spaces mapped</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-center">
              <div className="font-cal text-3xl text-white">{s.avgScore}</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">avg digital score</div>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Every score from a real browser scan — no estimates.
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-white px-4 py-12 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="font-cal text-3xl tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-sm text-gray-500">
              Enter your email and password to sign in
            </p>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  )
}
