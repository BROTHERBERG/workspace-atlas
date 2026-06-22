"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchWithCsrf } from "@/lib/csrf-client"

export default function ScoreMySpaceForm() {
  const [step, setStep] = useState(1)
  const totalSteps = 3

  // Controlled fields the API actually stores (rest are optional enrichment)
  const [spaceName, setSpaceName] = useState("")
  const [website, setWebsite] = useState("")
  const [email, setEmail] = useState("")
  const [goals, setGoals] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nextStep = () => step < totalSteps && setStep(step + 1)
  const prevStep = () => step > 1 && setStep(step - 1)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!spaceName.trim()) {
      setError("Please enter your space name (step 1).")
      setStep(1)
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email so we can send your score.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetchWithCsrf("/api/score-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          spaceName: spaceName.trim(),
          website: website.trim() || undefined,
          description: goals.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Something went wrong")
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        <h3 className="mt-4 font-cal text-xl">Request received.</h3>
        <p className="mt-2 max-w-sm text-gray-600">
          We'll run a live scan of {website ? website : "your site"} and send the full Digital Presence Score to{" "}
          <span className="font-medium text-black">{email}</span>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">
          Step {step} of {totalSteps}
        </h3>
        <div className="flex space-x-1">
          {[...Array(totalSteps)].map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full ${
                i + 1 === step ? "bg-midnight" : i + 1 < step ? "bg-gray-400" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="space-name">Space Name</Label>
            <Input id="space-name" placeholder="Enter your coworking space name" value={spaceName} onChange={(e) => setSpaceName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input id="website" placeholder="https://yourspace.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" defaultValue="Calgary" placeholder="Calgary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Province</Label>
              <Select defaultValue="ab">
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ab">Alberta</SelectItem>
                  <SelectItem value="bc">British Columbia</SelectItem>
                  <SelectItem value="sk">Saskatchewan</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="space-size">Space Size (sq ft/m²)</Label>
            <Input id="space-size" placeholder="Approximate size" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="social-facebook">Facebook Page URL</Label>
            <Input id="social-facebook" placeholder="https://facebook.com/yourspace" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="social-instagram">Instagram Handle</Label>
            <Input id="social-instagram" placeholder="@yourspace" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="social-linkedin">LinkedIn Page URL</Label>
            <Input id="social-linkedin" placeholder="https://linkedin.com/company/yourspace" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="google-business">Google Business Profile URL</Label>
            <Input id="google-business" placeholder="https://g.page/yourspace" />
          </div>
          <div className="space-y-2">
            <Label>Do you have any of the following?</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="has-booking" />
                <label htmlFor="has-booking" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Online booking system
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="has-virtual-tour" />
                <label htmlFor="has-virtual-tour" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Virtual tour
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="has-blog" />
                <label htmlFor="has-blog" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Blog or content marketing
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Your Name</Label>
            <Input id="contact-name" placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input id="contact-phone" type="tel" placeholder="Your phone number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-role">Your Role</Label>
            <Select>
              <SelectTrigger id="contact-role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="manager">General Manager</SelectItem>
                <SelectItem value="community">Community Manager</SelectItem>
                <SelectItem value="marketing">Marketing Manager</SelectItem>
                <SelectItem value="operations">Operations Manager</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goals">What are your main goals for improving your digital presence?</Label>
            <Textarea id="goals" placeholder="Tell us what you hope to achieve..." rows={3} value={goals} onChange={(e) => setGoals(e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <label htmlFor="terms" className="text-xs text-gray-500">
              I agree to the terms and conditions and privacy policy
            </label>
          </div>
        </div>
      )}

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex justify-between pt-4">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={prevStep}>
            Back
          </Button>
        ) : (
          <div></div>
        )}
        {step < totalSteps ? (
          <Button type="button" onClick={nextStep}>
            Continue
          </Button>
        ) : (
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        )}
      </div>
    </form>
  )
}
