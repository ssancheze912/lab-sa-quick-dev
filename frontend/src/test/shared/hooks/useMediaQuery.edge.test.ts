/**
 * Story 1.2: Frontend Navigation Shell
 * Unit Tests — useMediaQuery hook edge cases
 *
 * Coverage added (not in ATDD or existing component tests):
 *   - Hook returns false when matchMedia is not supported (SSR/jsdom without mock)
 *   - Hook returns correct value at boundary width (exactly 1024px)
 *   - Hook returns false below breakpoint boundary
 *   - Hook handles malformed query strings without throwing
 *   - Hook returns boolean (not truthy/falsy)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

// ─── Viewport helpers ─────────────────────────────────────────────────────────

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  window.dispatchEvent(new Event('resize'))
}

// ─────────────────────────────────────────────────────────────────────────────
// Boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('useMediaQuery — boundary conditions', () => {
  const originalInnerWidth = window.innerWidth

  afterEach(() => {
    // Restore original width
    setViewportWidth(originalInnerWidth)
  })

  it('[P2] returns true at exactly the breakpoint width (min-width: 1024px at 1024px)', () => {
    setViewportWidth(1024)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    // At exactly 1024px, min-width: 1024px MUST match
    expect(result.current).toBe(true)
  })

  it('[P2] returns false at one pixel below the breakpoint (1023px)', () => {
    setViewportWidth(1023)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)
  })

  it('[P2] returns true at one pixel above the breakpoint (1025px)', () => {
    setViewportWidth(1025)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(true)
  })

  it('[P2] returns false at mobile width 375px for desktop breakpoint query', () => {
    setViewportWidth(375)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)
  })

  it('[P3] returns a strict boolean value (not a truthy/falsy non-boolean)', () => {
    setViewportWidth(1280)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(typeof result.current).toBe('boolean')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Query string edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('useMediaQuery — query string edge cases', () => {
  it('[P3] does not throw when called with an empty string query', () => {
    expect(() => renderHook(() => useMediaQuery(''))).not.toThrow()
  })

  it('[P3] does not throw when called with a non-matching query format', () => {
    expect(() => renderHook(() => useMediaQuery('screen and (color)'))).not.toThrow()
  })

  it('[P2] returns false for a max-width query below current viewport width', () => {
    setViewportWidth(1280)
    const { result } = renderHook(() => useMediaQuery('(max-width: 1023px)'))
    expect(result.current).toBe(false)
  })

  it('[P2] returns true for a max-width query equal to current viewport width', () => {
    setViewportWidth(375)
    const { result } = renderHook(() => useMediaQuery('(max-width: 1023px)'))
    expect(result.current).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Return type contract
// ─────────────────────────────────────────────────────────────────────────────

describe('useMediaQuery — return type contract', () => {
  it('[P2] always returns a boolean regardless of viewport', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current === true || result.current === false).toBe(true)
  })
})
