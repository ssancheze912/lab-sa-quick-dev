import { useEffect, useState } from 'react'

const DESKTOP_QUERY = '(min-width: 1024px)'

/**
 * Subscribes to the desktop viewport media query (`>= lg: 1024px`) via
 * `window.matchMedia`. Used by `RootLayout` to mount a single shell (either
 * `AppShell` desktop or `MobileShell`) so that `<Outlet />` renders exactly
 * once — preventing duplicated route content in the DOM.
 *
 * NOTE: `matchMedia` is subscription-based and cheap. It is NOT the same
 * as reading `window.innerWidth` on resize (the antipattern called out in
 * the UX spec).
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia(DESKTOP_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(DESKTOP_QUERY)
    const handler = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    setIsDesktop(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isDesktop
}
