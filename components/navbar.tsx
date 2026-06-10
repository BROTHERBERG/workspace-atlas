"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Globe, Search, Award, Users, Compass, User, Settings, LogOut, Sparkles, Bell } from "lucide-react"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const routes = [
    {
      name: "Directory",
      href: "/directory",
      icon: <Search className="mr-2 h-4 w-4" />,
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
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute -inset-1 bg-[#f9cb16] rounded-full blur-sm"></div>
            <Globe className="h-6 w-6 text-black relative" />
          </div>
          <span className="hidden font-cal font-bold sm:inline-block">Workspace Atlas</span>
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <NavigationMenu className="hidden md:block">
            <NavigationMenuList>
              {routes.map((route) => (
                <NavigationMenuItem key={route.href}>
                  <Link href={route.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={`${navigationMenuTriggerStyle()} cursor-pointer yellow-hover`}
                    >
                      {route.name}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center justify-end space-x-4">
          <nav className="hidden items-center space-x-2 md:flex">
            {status === 'loading' ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                      <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notifications</span>
                    </Link>
                  </DropdownMenuItem>
                  {session.user.role === 'ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className={cn("text-sm font-medium transition-colors yellow-hover cursor-pointer")}
                >
                  Login
                </Link>
                <Button
                  asChild
                  className="bg-[#f9cb16] text-black hover:bg-[#f9cb16] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
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
                {session ? (
                  <>
                    <Link
                      href="/profile"
                      className={cn(
                        "flex items-center text-sm font-medium transition-colors yellow-hover cursor-pointer",
                        pathname === "/profile" ? "text-primary" : "text-muted-foreground",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className={cn(
                        "flex items-center text-sm font-medium transition-colors yellow-hover cursor-pointer",
                        pathname === "/dashboard" ? "text-primary" : "text-muted-foreground",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/notifications"
                      className={cn(
                        "flex items-center text-sm font-medium transition-colors yellow-hover cursor-pointer",
                        pathname === "/notifications" ? "text-primary" : "text-muted-foreground",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </Link>
                    <button
                      onClick={() => {
                        signOut()
                        setIsOpen(false)
                      }}
                      className="flex items-center text-sm font-medium transition-colors yellow-hover cursor-pointer text-muted-foreground"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/signin"
                      className={cn(
                        "flex items-center text-sm font-medium transition-colors yellow-hover cursor-pointer",
                        pathname === "/auth/signin" ? "text-primary" : "text-muted-foreground",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/signup"
                      className={cn(
                        "flex items-center text-sm font-medium transition-colors yellow-hover cursor-pointer",
                        pathname === "/auth/signup" ? "text-primary" : "text-muted-foreground",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
