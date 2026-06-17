import '@testing-library/jest-dom'

// Mock window.matchMedia — not available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('min-width: 1024px') ? window.innerWidth >= 1024 : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Default jsdom innerWidth for tests — set to desktop width so navigation-rail renders
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1280,
})
