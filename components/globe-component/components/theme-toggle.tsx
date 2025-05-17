"use client"

import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle({
  onToggle,
  isDark,
}: {
  onToggle: (isDark: boolean) => void
  isDark: boolean
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => onToggle(!isDark)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
    </Button>
  )
}
