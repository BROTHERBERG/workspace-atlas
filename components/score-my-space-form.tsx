"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function ScoreMySpaceForm() {
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="space-y-6">
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
            <Input id="space-name" placeholder="Enter your coworking space name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input id="website" placeholder="https://yourspace.com" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="City" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="au">Australia</SelectItem>
                  <SelectItem value="de">Germany</SelectItem>
                  <SelectItem value="fr">France</SelectItem>
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
                <label
                  htmlFor="has-booking"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Online booking system
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="has-virtual-tour" />
                <label
                  htmlFor="has-virtual-tour"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Virtual tour
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="has-blog" />
                <label
                  htmlFor="has-blog"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
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
            <Input id="contact-email" type="email" placeholder="you@example.com" />
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
            <Textarea id="goals" placeholder="Tell us what you hope to achieve..." rows={3} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <label htmlFor="terms" className="text-xs text-gray-500">
              I agree to the terms and conditions and privacy policy
            </label>
          </div>
        </div>
      )}

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
          <Button type="submit">Submit</Button>
        )}
      </div>
    </div>
  )
}
