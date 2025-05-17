"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Globe, Search, Award, Users, Compass } from "lucide-react"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const routes = [
    {
      name: "Directory",
      href: "/directory",
      icon: <Search className="mr-2 h-4 w-4" />,
    },
    {
      name: "Score My Space",
      href: "/score-my-space",
      icon: <Award className="mr-2 h-4 w-4" />,
    },
    {
      name: "Recruitment",
      href: "/recruitment",
      icon: <Users className="mr-2 h-4 w-4" />,
    },
    {
      name: "Haven Passport",
      href: "/haven-passport",
      icon: <Compass className="mr-2 h-4 w-4" />,
    },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black bg-white">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <div className="relative">
            <div className="absolute -inset-1 bg-[#f9cb16] rounded-full blur-sm"></div>
            <Globe className="h-6 w-6 text-black relative" />
          </div>
          <span className="hidden font-cal font-bold sm:inline-block">Workspace Atlas</span>
        </Link>
        <div className="hidden flex-1 md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              {routes.map((route) => (
                <NavigationMenuItem key={route.href}>
                  <Link href={route.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={`${navigationMenuTriggerStyle()} cursor-pointer yellow-hover`}
                    >
                      {route.icon}
                      {route.name}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="cursor-pointer yellow-hover">About</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-black p-6 no-underline outline-none focus:shadow-md cursor-pointer"
                          href="/about"
                        >
                          <Globe className="h-6 w-6 text-white" />
                          <div className="mb-2 mt-4 text-lg font-cal text-white">Our Mission</div>
                          <p className="text-sm leading-tight text-white/90">
                            Elevating the coworking industry through digital presence and talent matching.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                          href="/about/team"
                        >
                          <div className="text-sm font-cal leading-none">Team</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Meet the people behind Workspace Atlas.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                          href="/about/partners"
                        >
                          <div className="text-sm font-cal leading-none">Partners</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Our industry-leading partners and collaborators.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                          href="/blog"
                        >
                          <div className="text-sm font-cal leading-none">Blog</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Latest insights on coworking and digital presence.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="hidden items-center space-x-2 md:flex">
            <Link
              href="/login"
              className={cn("text-sm font-medium transition-colors yellow-hover cursor-pointer")}
            >
              Login
            </Link>
            <Button
              asChild
              className="bg-[#f9cb16] text-black hover:bg-[#f9cb16] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              <Link href="/register">Sign Up</Link>
            </Button>
          </nav>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden border-2 border-black"
                aria-label="Toggle Menu"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="border-r-2 border-black">
              <Link href="/" className="flex items-center space-x-2">
                <div className="relative">
                  <div className="absolute -inset-1 bg-[#f9cb16] rounded-full blur-sm"></div>
                  <Globe className="h-6 w-6 text-black relative" />
                </div>
                <span className="font-cal font-bold">Workspace Atlas</span>
              </Link>
              <nav className="mt-8 flex flex-col space-y-3">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center text-sm font-medium transition-colors yellow-hover cursor-pointer",
                      pathname === route.href ? "text-primary" : "text-muted-foreground",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {route.icon}
                    {route.name}
                  </Link>
                ))}
                <Link
                  href="/about"
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors yellow-hover cursor-pointer",
                    pathname === "/about" ? "text-primary" : "text-muted-foreground",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  About
                </Link>
                <Link
                  href="/login"
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors yellow-hover cursor-pointer",
                    pathname === "/login" ? "text-primary" : "text-muted-foreground",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors yellow-hover cursor-pointer",
                    pathname === "/register" ? "text-primary" : "text-muted-foreground",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
