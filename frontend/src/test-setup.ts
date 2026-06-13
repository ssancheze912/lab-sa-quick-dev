import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Set React act() environment for proper async testing
// @ts-expect-error - globalThis type
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Suppress JSDOM "Not implemented: Window's scrollTo()" warnings emitted by
// TanStack Router during test navigation — the method is a no-op in jsdom.
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
})
