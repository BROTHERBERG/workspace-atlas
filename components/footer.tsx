import Link from "next/link"
import { Globe, Mail, Phone, MapPin, Twitter, Facebook, Instagram, Linkedin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container px-4 py-12 md:px-6 md:py-16 lg:py-20">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute -inset-1 bg-[#f9cb16] rounded-full blur-sm"></div>
                <Globe className="h-6 w-6 text-white relative" />
              </div>
              <span className="text-xl font-cal">Workspace Atlas</span>
            </div>
            <p className="text-gray-300">
              The first global coworking directory that scores spaces, upgrades them, and connects them with leadership
              talent.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-300 hover:text-[#f9cb16]">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-300 hover:text-[#f9cb16]">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-gray-300 hover:text-[#f9cb16]">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-gray-300 hover:text-[#f9cb16]">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-cal">Directory</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/directory" className="text-gray-300 hover:text-[#f9cb16]">
                  Browse Spaces
                </Link>
              </li>
              <li>
                <Link href="/directory/featured" className="text-gray-300 hover:text-[#f9cb16]">
                  Featured Spaces
                </Link>
              </li>
              <li>
                <Link href="/directory/verified" className="text-gray-300 hover:text-[#f9cb16]">
                  Verified Spaces
                </Link>
              </li>
              <li>
                <Link href="/directory/map" className="text-gray-300 hover:text-[#f9cb16]">
                  Map View
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-cal">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/score-my-space" className="text-gray-300 hover:text-[#f9cb16]">
                  Score My Space
                </Link>
              </li>
              <li>
                <Link href="/recruitment" className="text-gray-300 hover:text-[#f9cb16]">
                  Recruitment
                </Link>
              </li>
              <li>
                <Link href="/digital-upgrade" className="text-gray-300 hover:text-[#f9cb16]">
                  Digital Upgrade
                </Link>
              </li>
              <li>
                <Link href="/list-your-space" className="text-gray-300 hover:text-[#f9cb16]">
                  List Your Space
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-cal">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-[#f9cb16]" />
                <a href="mailto:hello@workspaceatlas.com" className="text-gray-300 hover:text-[#f9cb16]">
                  hello@workspaceatlas.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-[#f9cb16]" />
                <a href="tel:+1234567890" className="text-gray-300 hover:text-[#f9cb16]">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-[#f9cb16]" />
                <span className="text-gray-300">
                  123 Coworking Street
                  <br />
                  New York, NY 10001
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Workspace Atlas. All rights reserved.
            </p>
            <div className="flex space-x-4 text-sm text-gray-400">
              <Link href="/terms" className="hover:text-[#f9cb16]">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-[#f9cb16]">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="hover:text-[#f9cb16]">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
