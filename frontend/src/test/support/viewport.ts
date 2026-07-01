import { vi } from 'vitest'

/**
 * Test support helper (not a data factory — this story has no domain data).
 * Simulates a desktop (>= 1024px / `lg:`) or mobile (< 1024px) viewport by
 * stubbing `window.matchMedia` for the `(min-width: 1024px)` query used by
 * responsive breakpoint checks, and updating `window.innerWidth`.
 *
 * Must be called BEFORE rendering the component (network-first-equivalent
 * principle: configure environment before triggering the behavior under test).
 */
export function mockViewport(kind: 'desktop' | 'mobile') {
  const isDesktop = kind === 'desktop'
  const width = isDesktop ? 1280 : 375

  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isDesktop,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))

  window.dispatchEvent(new Event('resize'))
}
