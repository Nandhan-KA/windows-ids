'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export function useThemeSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // When mounted on client, we can show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  // Safe theme setting to avoid hydration issues
  const safeSetTheme = (newTheme: string) => {
    if (mounted) {
      setTheme(newTheme)
      // Persist the theme in localStorage for better persistence
      localStorage.setItem('theme-preference', newTheme)
    }
  }

  // Get the actual current theme, accounting for system preference
  const currentTheme = theme || 'system'
  
  // Get the visual theme (what's actually being displayed)
  const actualTheme = mounted ? resolvedTheme || currentTheme : 'dark'

  return {
    theme: currentTheme,
    setTheme: safeSetTheme,
    actualTheme,
    mounted
  }
} 