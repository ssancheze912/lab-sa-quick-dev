import { expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
// `vitest-axe` (0.1.0) ships broken type declarations for its `matchers`
// subpath (its `toHaveNoViolations` re-export is mis-tagged as type-only
// under `verbatimModuleSyntax`) and an empty compiled `extend-expect.js`.
// `./vitest-axe-matchers.d.ts` restates the (verified-working, see
// `vitest-axe/dist/matchers.js`) runtime shape so it can be imported normally.
import { toHaveNoViolations } from 'vitest-axe/matchers'

expect.extend({ toHaveNoViolations })

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations: () => void
  }
}

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
