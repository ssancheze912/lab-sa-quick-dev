import '@testing-library/jest-dom'

// Mock window.matchMedia for jsdom (not implemented by default)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: (() => {
      const minWidth = query.match(/min-width:\s*(\d+)px/)
      const maxWidth = query.match(/max-width:\s*(\d+)px/)
      if (minWidth) return window.innerWidth >= parseInt(minWidth[1], 10)
      if (maxWidth) return window.innerWidth <= parseInt(maxWidth[1], 10)
      return false
    })(),
    media: query,
    onchange: null,
    addEventListenerCalled: false,
    addEventListener: (_type: string, _listener: EventListenerOrEventListenerObject) => {
      // noop — tests control viewport via window.innerWidth mutations
    },
    removeEventListener: (_type: string, _listener: EventListenerOrEventListenerObject) => {
      // noop
    },
    dispatchEvent: () => true,
  }),
})
