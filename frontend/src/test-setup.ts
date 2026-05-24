import '@testing-library/jest-dom'

// Mock window.matchMedia for Vitest JSDOM environment.
// JSDOM does not implement matchMedia; this mock returns a non-matching MediaQueryList
// so useMediaQuery always returns false in unit tests (simulates mobile/narrow viewport).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
