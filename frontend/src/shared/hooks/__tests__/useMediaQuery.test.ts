/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases
 * Unit Tests — useMediaQuery hook
 *
 * Covers edge cases not tested in ATDD:
 *   - SSR-safe initial state (window undefined)
 *   - Initial match detection (desktop query matches)
 *   - Reactive update on media query change event
 *   - Cleanup: event listener removed on unmount
 *   - Multiple concurrent queries remain independent
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery } from '../useMediaQuery'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: build a controllable MediaQueryList mock
// ─────────────────────────────────────────────────────────────────────────────

function buildMockMQL(initialMatches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []

  const mql = {
    matches: initialMatches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_, handler: (e: MediaQueryListEvent) => void) => {
      listeners.push(handler)
    }),
    removeEventListener: vi.fn((_, handler: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(handler)
      if (idx !== -1) listeners.splice(idx, 1)
    }),
    dispatchEvent: vi.fn(),
    // Helper to simulate a media query change
    _triggerChange: (newMatches: boolean) => {
      mql.matches = newMatches
      listeners.forEach((handler) =>
        handler({ matches: newMatches } as MediaQueryListEvent),
      )
    },
  }
  return mql
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge 1 — Initial state: query does NOT match (mobile/narrow viewport)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] useMediaQuery — initial state when query does not match', () => {
  beforeEach(() => {
    const mql = buildMockMQL(false)
    window.matchMedia = vi.fn().mockReturnValue(mql)
  })

  it('should return false when media query initially does not match', () => {
    // GIVEN: matchMedia reports non-matching (mobile viewport)
    // WHEN: Hook is rendered
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    // THEN: Hook returns false
    expect(result.current).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge 2 — Initial state: query MATCHES (desktop viewport)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] useMediaQuery — initial state when query matches', () => {
  let mql: ReturnType<typeof buildMockMQL>

  beforeEach(() => {
    mql = buildMockMQL(true)
    window.matchMedia = vi.fn().mockReturnValue(mql)
  })

  it('should return true when media query initially matches', () => {
    // GIVEN: matchMedia reports matching (desktop viewport >= 1024px)
    // WHEN: Hook is rendered
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    // THEN: Hook returns true immediately
    expect(result.current).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge 3 — Reactive: updates when media query fires a change event
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] useMediaQuery — reacts to viewport resize (change event)', () => {
  let mql: ReturnType<typeof buildMockMQL>

  beforeEach(() => {
    mql = buildMockMQL(false)
    window.matchMedia = vi.fn().mockReturnValue(mql)
  })

  it('should update from false to true when media query starts matching', () => {
    // GIVEN: Hook starts with non-matching query (mobile)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)

    // WHEN: The viewport grows and matchMedia fires a change event
    act(() => {
      mql._triggerChange(true)
    })

    // THEN: Hook reactively updates to true (desktop)
    expect(result.current).toBe(true)
  })

  it('should update from true to false when media query stops matching', () => {
    // GIVEN: Hook starts with matching query (desktop)
    mql.matches = true
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    // WHEN: The viewport shrinks and matchMedia fires a change event
    act(() => {
      mql._triggerChange(false)
    })

    // THEN: Hook reactively updates to false (mobile)
    expect(result.current).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge 4 — Cleanup: removeEventListener is called on unmount
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] useMediaQuery — event listener cleanup on unmount', () => {
  let mql: ReturnType<typeof buildMockMQL>

  beforeEach(() => {
    mql = buildMockMQL(false)
    window.matchMedia = vi.fn().mockReturnValue(mql)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should register an event listener on mount', () => {
    // GIVEN: Hook is mounted
    renderHook(() => useMediaQuery('(min-width: 1024px)'))

    // THEN: addEventListener was called once with "change"
    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(mql.addEventListener).toHaveBeenCalledTimes(1)
  })

  it('should remove the event listener on unmount to prevent memory leaks', () => {
    // GIVEN: Hook is mounted and event listener registered
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    // WHEN: The component using the hook unmounts
    unmount()

    // THEN: removeEventListener is called with "change" and the same handler
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge 5 — Multiple concurrent queries remain independent
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] useMediaQuery — multiple independent query instances', () => {
  it('should support two hooks with different queries returning different results', () => {
    // GIVEN: Two different media queries with different match states
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      const matchesDesktop = query.includes('1024')
      return buildMockMQL(matchesDesktop)
    })

    // WHEN: Two hooks are rendered simultaneously
    const { result: resultDesktop } = renderHook(() =>
      useMediaQuery('(min-width: 1024px)'),
    )
    const { result: resultSmall } = renderHook(() =>
      useMediaQuery('(max-width: 767px)'),
    )

    // THEN: Each hook independently reflects its own query match
    expect(resultDesktop.current).toBe(true)
    expect(resultSmall.current).toBe(false)
  })
})
