import '@testing-library/jest-dom'

// Mock window.matchMedia for JSDOM — evaluates against window.innerWidth
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
