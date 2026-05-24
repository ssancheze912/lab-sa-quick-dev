import { useState, useEffect } from 'react'

/**
 * Hook to track a CSS media query match.
 * Returns true when the media query matches, false otherwise.
 * SSR-safe: returns false until the effect runs on the client.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQueryList = window.matchMedia(query)
    setMatches(mediaQueryList.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQueryList.addEventListener('change', handler)
    return () => {
      mediaQueryList.removeEventListener('change', handler)
    }
  }, [query])

  return matches
}
