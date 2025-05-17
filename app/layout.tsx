import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { calSans } from "./fonts"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

// Cal Sans is imported from ./fonts.ts

export const metadata = {
  title: "Workspace Atlas | Global Coworking Directory",
  description: "Find a space. Grow your brand. Hire your crew. All in one place.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${calSans.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Navbar />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
