"use client"

import { useState } from "react"
import { Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

export default function ContactForm() {
  const [formType, setFormType] = useState<"message" | "tour">("message")

  return (
    <div className="mt-4 space-y-4">
      <div className="flex space-x-4">
        <Button
          type="button"
          variant={formType === "message" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setFormType("message")}
        >
          Send Message
        </Button>
        <Button
          type="button"
          variant={formType === "tour" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setFormType("tour")}
        >
          Book a Tour
        </Button>
      </div>

      {formType === "message" ? (
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Your email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" type="tel" placeholder="Your phone number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Your message" rows={4} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <label htmlFor="terms" className="text-xs text-gray-500">
              I agree to the terms and conditions and privacy policy
            </label>
          </div>
          <Button type="submit" className="w-full">
            Send Message
          </Button>
        </form>
      ) : (
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tour-name">Name</Label>
            <Input id="tour-name" placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tour-email">Email</Label>
            <Input id="tour-email" type="email" placeholder="Your email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tour-phone">Phone</Label>
            <Input id="tour-phone" type="tel" placeholder="Your phone number" />
          </div>
          <div className="space-y-2">
            <Label>Preferred Date</Label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input type="date" className="flex-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Preferred Time</Label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM - 3PM)</SelectItem>
                  <SelectItem value="evening">Evening (3PM - 6PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>I'm interested in</Label>
            <RadioGroup defaultValue="hot-desk">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hot-desk" id="hot-desk" />
                <Label htmlFor="hot-desk">Hot Desk</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dedicated-desk" id="dedicated-desk" />
                <Label htmlFor="dedicated-desk">Dedicated Desk</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private-office" id="private-office" />
                <Label htmlFor="private-office">Private Office</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="tour-terms" />
            <label htmlFor="tour-terms" className="text-xs text-gray-500">
              I agree to the terms and conditions and privacy policy
            </label>
          </div>
          <Button type="submit" className="w-full">
            Book Tour
          </Button>
        </form>
      )}
    </div>
  )
}
