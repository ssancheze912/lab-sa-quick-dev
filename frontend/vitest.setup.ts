/**
 * Vitest setup file — loaded automatically via vitest.config.ts `setupFiles`.
 *
 * Adds jest-dom matchers (toBeInTheDocument, toHaveTextContent, toBeVisible, etc.)
 * to Vitest's expect. Required for @testing-library/react component tests
 * introduced by Story 1.2.
 *
 * Also normalizes `window.location` so tests can spy on `assign` / redefine
 * `href` without hitting JSDOM's `Cannot redefine property` restriction.
 *
 * Story 2.1: registers an automatic `cleanup()` after each test. With
 * `globals: false` in vitest.config.ts, React Testing Library does NOT auto-clean
 * the DOM between tests — the previous render's nodes leak into the next test
 * and cause "Found multiple elements" errors on shared `data-testid` selectors.
 * Doing it centrally avoids requiring every test file to remember `afterEach`.
 */
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// Make `window.location` (and its `assign` method) configurable so component
// tests that assert routing does NOT go through window.location can safely
// redefine those properties for the duration of a test.
try {
  const originalLocation = window.location
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: {
      ...originalLocation,
      assign: originalLocation.assign?.bind(originalLocation) ?? (() => {}),
      replace: originalLocation.replace?.bind(originalLocation) ?? (() => {}),
      reload: originalLocation.reload?.bind(originalLocation) ?? (() => {}),
      get href() {
        return originalLocation.href
      },
      set href(_value: string) {
        // no-op; tests may re-define this getter/setter to detect reassignment
      },
    },
  })
} catch {
  // If JSDOM already permits it, do nothing.
}
