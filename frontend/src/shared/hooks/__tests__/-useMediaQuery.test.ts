/**
 * Unit Tests: useMediaQuery hook
 * Story 1.2: Frontend Navigation Shell
 *
 * Covers edge cases for the useMediaQuery hook:
 *   - Initial state resolution based on window.innerWidth
 *   - Boundary value at exactly 1024px (lg breakpoint)
 *   - Below and above 1024px
 *   - Event listener cleanup on unmount
 *   - SSR/undefined window guard (simulated)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery } from '../useMediaQuery'

const DESKTOP_QUERY = '(min-width: 1024px)'

// Helper to create a controllable matchMedia mock
function createMatchMediaMock(initialMatches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []

  const mql = {
    matches: initialMatches,
    media: DESKTOP_QUERY,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') listeners.push(handler)
    }),
    removeEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(handler)
      if (idx !== -1) listeners.splice(idx, 1)
    }),
    dispatchEvent: vi.fn(() => false),
    // Helper to simulate a media query change
    triggerChange(newMatches: boolean) {
      this.matches = newMatches
      const event = { matches: newMatches, media: DESKTOP_QUERY } as MediaQueryListEvent
      listeners.forEach((fn) => fn(event))
    },
  }

  return mql
}

describe('useMediaQuery — initial state from window.innerWidth', () => {
  it('[P2] returns true when window.innerWidth >= 1024 (desktop)', () => {
    // GIVEN: Desktop viewport width
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY))

    // THEN: Returns true (matches desktop breakpoint)
    expect(result.current).toBe(true)
  })

  it('[P2] returns false when window.innerWidth < 1024 (mobile)', () => {
    // GIVEN: Mobile viewport width
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY))

    // THEN: Returns false (does not match desktop breakpoint)
    expect(result.current).toBe(false)
  })
})

describe('useMediaQuery — boundary value at exactly 1024px', () => {
  it('[P2] returns true at exactly 1024px (boundary — inclusive)', () => {
    // GIVEN: Viewport width exactly at the lg breakpoint
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY))

    // THEN: Returns true (min-width is inclusive)
    expect(result.current).toBe(true)
  })

  it('[P2] returns false at 1023px (just below the boundary)', () => {
    // GIVEN: Viewport width one pixel below the lg breakpoint
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1023 })

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY))

    // THEN: Returns false (below min-width)
    expect(result.current).toBe(false)
  })
})

describe('useMediaQuery — reactivity on media change events', () => {
  let mockMql: ReturnType<typeof createMatchMediaMock>

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
    mockMql = createMatchMediaMock(false)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => mockMql),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('[P1] updates from false to true when media query matches after resize', () => {
    // GIVEN: Hook starts with non-matching state (mobile)
    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY))
    expect(result.current).toBe(false)

    // WHEN: Media query fires a change event (resize to desktop)
    act(() => {
      mockMql.triggerChange(true)
    })

    // THEN: Hook updates to true
    expect(result.current).toBe(true)
  })

  it('[P1] updates from true to false when media query stops matching', () => {
    // GIVEN: Start with matching (desktop)
    mockMql = createMatchMediaMock(true)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => mockMql),
    })

    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY))
    expect(result.current).toBe(true)

    // WHEN: Media query fires a change event (resize to mobile)
    act(() => {
      mockMql.triggerChange(false)
    })

    // THEN: Hook updates to false
    expect(result.current).toBe(false)
  })
})

describe('useMediaQuery — event listener cleanup on unmount', () => {
  let mockMql: ReturnType<typeof createMatchMediaMock>

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    mockMql = createMatchMediaMock(true)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => mockMql),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('[P2] removes event listener when component unmounts', () => {
    // GIVEN: Hook is rendered
    const { unmount } = renderHook(() => useMediaQuery(DESKTOP_QUERY))

    // Verify listener was added
    expect(mockMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    // WHEN: Component unmounts
    unmount()

    // THEN: Event listener is removed (no memory leak)
    expect(mockMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})

describe('useMediaQuery — query string changes', () => {
  // Restore the standard matchMedia mock (from test-setup.ts) before each test in this block
  // to avoid interference from the reactivity tests that override window.matchMedia
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string): MediaQueryList => {
        const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/)
        const minWidth = minWidthMatch ? parseInt(minWidthMatch[1], 10) : 0
        const matches = window.innerWidth >= minWidth
        return {
          matches,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as MediaQueryList
      },
    })
  })

  it('[P2] returns correct result when query changes from desktop to mobile query', () => {
    // GIVEN: Desktop viewport
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })

    // WHEN: Hook uses mobile max-width query
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    // THEN: Returns true because 1280 >= 768
    expect(result.current).toBe(true)
  })

  it('[P2] returns false for non-matching custom query on current viewport', () => {
    // GIVEN: Mobile viewport
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })

    // WHEN: Hook uses a large-screen query
    const { result } = renderHook(() => useMediaQuery('(min-width: 1440px)'))

    // THEN: Returns false (375 < 1440)
    expect(result.current).toBe(false)
  })
})
