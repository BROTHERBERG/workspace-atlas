"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Compass, Search, Award, Users, Radar } from "lucide-react"

const routes = [
  { name: "Directory", href: "/directory", icon: Search },
  { name: "Intelligence", href: "/intelligence", icon: Radar },
  { name: "Score My Space", href: "/score-my-space", icon: Award },
  { name: "Recruitment", href: "/recruitment", icon: Users },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-black bg-white">
      {/* Wide: edge-to-edge, wider than the content column */}
      <div className="flex h-16 w-full items-center px-4 sm:px-6 lg:px-10">
        <Link href="/" className="mr-8 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f9cb16] border-2 border-black">
            <Compass className="h-4 w-4 text-black" />
          </span>
          <span className="font-cal text-lg font-bold tracking-tight">
            Workscape<span className="text-[#caa406]"> Atlas</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {routes.map((route) => {
            const active = pathname === route.href
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-black text-white" : "text-gray-700 hover:bg-[#f9cb16]/30",
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.name}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <span className="hidden items-center gap-1.5 text-xs font-medium text-gray-500 lg:flex">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Calgary · live data
          </span>
          <Button
            asChild
            className="bg-[#f9cb16] text-black hover:bg-[#f9cb16] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            <Link href="/intelligence">View the map</Link>
          </Button>
        </div>

        {/* Mobile */}
        <div className="ml-auto md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-2 border-black" aria-label="Toggle Menu">
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="border-r-2 border-black">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f9cb16] border-2 border-black">
                  <Compass className="h-4 w-4 text-black" />
                </span>
                <span className="font-cal text-lg font-bold">Workscape Atlas</span>
              </Link>
              <nav className="mt-8 flex flex-col space-y-1">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium",
                      pathname === route.href ? "bg-black text-white" : "text-gray-700 hover:bg-[#f9cb16]/30",
                    )}
                  >
                    <route.icon className="h-4 w-4" />
                    {route.name}
                  </Link>
                ))}
                <Button asChild className="mt-4 bg-[#f9cb16] text-black border-2 border-black">
                  <Link href="/intelligence" onClick={() => setIsOpen(false)}>
                    View the map
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
