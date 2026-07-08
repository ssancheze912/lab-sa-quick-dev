import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from '@/test/msw/server'

// Story 2.1 — Start MSW once per process; reset request handlers between tests
// so per-test overrides via `server.use(...)` do not leak.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// jsdom does not implement matchMedia; siesa-ui-kit responsive helpers rely on it.
// Story 1.2 needs to force desktop (>= 1024px) and mobile (< 1024px) viewports in tests.
// Tests can override this by calling setMatchMediaWidth(width).
function createMatchMedia(width: number) {
  return (query: string) => {
    const minWidthMatch = /\(min-width:\s*(\d+)px\)/.exec(query)
    const maxWidthMatch = /\(max-width:\s*(\d+)px\)/.exec(query)
    let matches = false
    if (minWidthMatch) {
      matches = width >= Number(minWidthMatch[1])
    } else if (maxWidthMatch) {
      matches = width <= Number(maxWidthMatch[1])
    }
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList
  }
}

;(globalThis as unknown as { setMatchMediaWidth: (w: number) => void }).setMatchMediaWidth = (
  width: number,
) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width, writable: true })
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: createMatchMedia(width),
  })
  window.dispatchEvent(new Event('resize'))
}

// Default to desktop viewport so LayoutBase renders its rail
;(globalThis as unknown as { setMatchMediaWidth: (w: number) => void }).setMatchMediaWidth(1280)

// jsdom's window.location is a readonly proxy; replace it with a plain object we can spy on.
const reloadSpy = vi.fn()
const originalLocation = window.location
const spyableLocation: Location = {
  ...originalLocation,
  assign: vi.fn(),
  replace: vi.fn(),
  reload: reloadSpy,
} as unknown as Location
Object.defineProperty(window, 'location', {
  configurable: true,
  writable: true,
  value: spyableLocation,
})
;(globalThis as unknown as { __reloadSpy: typeof reloadSpy }).__reloadSpy = reloadSpy

afterEach(() => {
  cleanup()
  reloadSpy.mockClear()
})
