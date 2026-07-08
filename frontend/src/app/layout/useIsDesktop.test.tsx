/**
 * Story 1.2 — Coverage for `useIsDesktop` hook.
 * `useIsDesktop` decides which shell (`AppShell` vs `MobileShell`) is mounted.
 * It relies on `window.matchMedia('(min-width: 1024px)')` — the ATDD suite
 * doesn't isolate this hook, so these tests target it directly.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsDesktop } from './useIsDesktop'

declare global {
  // eslint-disable-next-line no-var
  var setMatchMediaWidth: (width: number) => void
}

describe('useIsDesktop', () => {
  afterEach(() => {
    // Restore desktop viewport for other tests.
    globalThis.setMatchMediaWidth(1280)
  })

  it('[P1] GIVEN the viewport is 1280px, WHEN the hook mounts, THEN it returns true', () => {
    globalThis.setMatchMediaWidth(1280)
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
  })

  it('[P1] GIVEN the viewport is 375px, WHEN the hook mounts, THEN it returns false', () => {
    globalThis.setMatchMediaWidth(375)
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(false)
  })

  it('[P1] GIVEN the exact breakpoint 1024px, WHEN the hook mounts, THEN it returns true (>= boundary matches)', () => {
    globalThis.setMatchMediaWidth(1024)
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
  })

  it('[P1] GIVEN one pixel below the breakpoint (1023px), WHEN the hook mounts, THEN it returns false', () => {
    globalThis.setMatchMediaWidth(1023)
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(false)
  })

  it('[P2] GIVEN the hook subscribes to matchMedia, THEN it registers a "change" listener and removes it on unmount', () => {
    // Custom matchMedia that records add/remove calls.
    const addSpy = vi.fn()
    const removeSpy = vi.fn()
    const mockMql = {
      matches: true,
      media: '(min-width: 1024px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addSpy,
      removeEventListener: removeSpy,
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList

    const originalMatchMedia = window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: () => mockMql,
    })

    try {
      const { unmount } = renderHook(() => useIsDesktop())
      expect(addSpy).toHaveBeenCalledWith('change', expect.any(Function))
      unmount()
      expect(removeSpy).toHaveBeenCalledWith('change', expect.any(Function))
      // The same listener reference should be passed to both add and remove.
      const addedListener = addSpy.mock.calls[0][1]
      const removedListener = removeSpy.mock.calls[0][1]
      expect(addedListener).toBe(removedListener)
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: originalMatchMedia,
      })
    }
  })
})
