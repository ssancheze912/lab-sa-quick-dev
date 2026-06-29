import '@testing-library/jest-dom'

// Mock window.matchMedia — not implemented in jsdom.
// The implementation evaluates min-width queries against window.innerWidth so
// that tests can control which breakpoint is active by setting window.innerWidth
// in a beforeEach block.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string): MediaQueryList => {
    // Parse "(min-width: Npx)" queries to respect window.innerWidth in tests
    const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/)
    const matches = minWidthMatch
      ? window.innerWidth >= parseInt(minWidthMatch[1], 10)
      : false

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
