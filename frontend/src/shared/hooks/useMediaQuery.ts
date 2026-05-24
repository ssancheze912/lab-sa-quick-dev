import { useState, useEffect } from 'react'

/**
 * Hook that returns true when the given CSS media query matches.
 * Provides SSR-safe behavior and updates reactively on resize.
 *
 * @param query - CSS media query string (e.g. '(min-width: 1024px)')
 * @returns boolean indicating whether the query currently matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    setMatches(mediaQueryList.matches)
    mediaQueryList.addEventListener('change', handleChange)
    return () => {
      mediaQueryList.removeEventListener('change', handleChange)
    }
  }, [query])

  return matches
}
