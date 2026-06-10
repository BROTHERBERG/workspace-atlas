import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { ErrorBoundaryProvider } from "@/components/ErrorBoundary"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { calSans } from "./fonts"

// Using system font stack to avoid external network dependency
const systemFonts = {
  variable: "--font-sans",
  className: "font-sans",
}

// Cal Sans is imported from ./fonts.ts

export const viewport = {
  themeColor: '#f9cb16',
}

export const metadata = {
  title: "Workspace Atlas | Global Coworking Directory",
  description: "Find a space. Grow your brand. Hire your crew. All in one place.",
  generator: 'v0.dev',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Workspace Atlas',
    startupImage: [
      '/icons/apple-splash-2048-2732.jpg',
      '/icons/apple-splash-1668-2224.jpg',
      '/icons/apple-splash-1536-2048.jpg',
      '/icons/apple-splash-1125-2436.jpg',
      '/icons/apple-splash-1242-2208.jpg',
      '/icons/apple-splash-750-1334.jpg',
      '/icons/apple-splash-640-1136.jpg',
    ],
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${systemFonts.variable} ${calSans.variable} font-sans`}>
        <ErrorBoundaryProvider>
          <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              <Navbar />
              {children}
              <Footer />
              <Toaster />
              <SonnerToaster />
            </ThemeProvider>
          </SessionProvider>
        </ErrorBoundaryProvider>
      </body>
    </html>
  )
}
