/**
 * Story 1.2: Frontend Navigation Shell — Expanded Coverage (testarch-automate)
 *
 * Unit tests for `useMediaQuery` (P2)
 *
 * Edge cases:
 *   - Initial match (true / false)
 *   - Reactive update when matchMedia change event fires
 *   - SSR-safe (no `window.matchMedia` available)
 *   - Cleanup of listener on unmount
 *
 * Not covered by ATDD — these tests target the hook directly.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

type Listener = (ev: MediaQueryListEvent) => void

interface MockMQL {
  matches: boolean
  media: string
  onchange: Listener | null
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  addListener: ReturnType<typeof vi.fn>
  removeListener: ReturnType<typeof vi.fn>
  dispatchEvent: () => boolean
  _trigger: (matches: boolean) => void
}

function createMQL(initialMatches: boolean, query: string): MockMQL {
  const listeners: Listener[] = []
  const mql: MockMQL = {
    matches: initialMatches,
    media: query,
    onchange: null,
    addEventListener: vi.fn((_event: string, listener: Listener) => {
      listeners.push(listener)
    }),
    removeEventListener: vi.fn((_event: string, listener: Listener) => {
      const idx = listeners.indexOf(listener)
      if (idx >= 0) listeners.splice(idx, 1)
    }),
    addListener: vi.fn((listener: Listener) => {
      listeners.push(listener)
    }),
    removeListener: vi.fn((listener: Listener) => {
      const idx = listeners.indexOf(listener)
      if (idx >= 0) listeners.splice(idx, 1)
    }),
    dispatchEvent: () => true,
    _trigger: (matches: boolean) => {
      mql.matches = matches
      listeners.forEach((l) =>
        l({ matches, media: query } as MediaQueryListEvent),
      )
    },
  }
  return mql
}

describe('useMediaQuery — reactive viewport matching (P2)', () => {
  let originalMatchMedia: typeof window.matchMedia | undefined

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia
    }
    vi.restoreAllMocks()
  })

  test('[P2] GIVEN matchMedia matches WHEN hook initialises THEN returns true', () => {
    const mql = createMQL(true, '(min-width: 1024px)')
    window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(true)
  })

  test('[P2] GIVEN matchMedia does NOT match WHEN hook initialises THEN returns false', () => {
    const mql = createMQL(false, '(min-width: 1024px)')
    window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)
  })

  test('[P2] GIVEN hook is mounted WHEN media query state changes THEN the hook returns the new value', () => {
    const mql = createMQL(false, '(min-width: 1024px)')
    window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)

    // Simulate viewport crossing the breakpoint (e.g. mobile → desktop rotate).
    act(() => {
      mql._trigger(true)
    })

    expect(result.current).toBe(true)
  })

  test('[P2] GIVEN hook unmounts WHEN cleanup runs THEN removeEventListener is invoked', () => {
    const mql = createMQL(true, '(min-width: 1024px)')
    window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(mql.addEventListener).toHaveBeenCalled()

    unmount()
    expect(mql.removeEventListener).toHaveBeenCalled()
  })

  test('[P3] GIVEN environment has no matchMedia WHEN hook runs THEN returns false (SSR safe)', () => {
    // Simulate missing matchMedia (e.g. SSR / older runtime).
    // @ts-expect-error — intentional deletion for SSR-safety assertion.
    window.matchMedia = undefined

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)
  })
})
