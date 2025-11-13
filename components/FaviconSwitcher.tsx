'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

export function FaviconSwitcher() {
  const { theme, systemTheme } = useTheme()

  useEffect(() => {
    // Determina el tema actual
    const currentTheme = theme === 'system' ? systemTheme : theme

    // Remove old favicon links
    const existingLinks = document.querySelectorAll('link[rel="icon"][data-theme]')
    existingLinks.forEach(link => link.remove())

    // Create new favicon link based on theme
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.sizes = '32x32'
    link.dataset.theme = 'true'

    if (currentTheme === 'dark') {
      link.href = '/icon-dark-32x32.png?v=' + Date.now()
    } else {
      link.href = '/icon-light-32x32.png?v=' + Date.now()
    }

    document.head.appendChild(link)

    // Log for debugging
    console.log(`🎨 Favicon switched to: ${currentTheme} - ${link.href}`)
  }, [theme, systemTheme])

  return null
}
