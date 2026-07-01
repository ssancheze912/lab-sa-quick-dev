import '@testing-library/jest-dom/vitest'
import 'vitest-axe/extend-expect'

// jsdom does not implement matchMedia; siesa-ui-kit / responsive components
// (LayoutBase, NavigationBar) rely on it for lg: breakpoint detection in some
// internal hooks. Provide a deterministic stub; individual tests override
// `window.matchMedia` return value via `mockMatchMedia(matches)` helper.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
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
