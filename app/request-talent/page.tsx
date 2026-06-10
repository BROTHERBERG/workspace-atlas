import { Users, Target, Clock, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TalentRequestForm } from '@/components/forms/TalentRequestForm'

export const metadata = {
  title: 'Request Talent | Workspace Atlas',
  description: 'Find exceptional leadership for your coworking space. Tell us who you need and we connect you with matched candidates.',
}

interface RequestTalentPageProps {
  searchParams: Promise<{ space?: string }>
}

export default async function RequestTalentPage({ searchParams }: RequestTalentPageProps) {
  const { space } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-black py-16 text-white md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Find Leadership That Grows Your Space
            </h1>
            <p className="mx-auto mt-4 max-w-[600px] text-gray-300 md:text-xl">
              From General Managers to Community leads — tell us who you need, and we&apos;ll connect you with
              candidates who live the coworking values: community, collaboration, connectivity.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Tell Us Who You Need</h3>
                <p className="mt-2 text-gray-500">
                  Describe the role, the space, and what success looks like. Two minutes, no commitment.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">We Match Candidates</h3>
                <p className="mt-2 text-gray-500">
                  Your request is matched against industry-specialist recruiters and pre-vetted coworking talent.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Hear Back in 48 Hours</h3>
                <p className="mt-2 text-gray-500">
                  A real human follows up with matched candidates or a clear next step — not a newsletter.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="pb-16 md:pb-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Request Talent</h2>
            <p className="mt-4 text-gray-500 md:text-xl">
              {space ? `Hiring for ${space}? ` : ''}Tell us about the role and we&apos;ll take it from there.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
            <TalentRequestForm defaultSpaceName={space} />
          </div>
          <div className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="h-4 w-4" />
            Your request is confidential — we never list your opening publicly without permission.
          </div>
        </div>
      </section>
    </div>
  )
}
