"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  // To prevent hydration mismatch, only render toggle after mount
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-12 h-12" />

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="flex items-center justify-center rounded-full w-14 h-14 border-2 border-primary/20 hover:border-primary bg-background/80 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(255,204,0,0.3)] hover:scale-110 transition-all text-foreground"
      aria-label="Toggle theme"
    >
      <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-yellow-500" />
      <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-300" />
    </button>
  )
}
