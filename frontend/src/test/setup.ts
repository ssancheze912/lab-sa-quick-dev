import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock TanStack Router's Link component to render a plain <a> tag in tests.
// This allows components that use <Link> to render without a router context.
// Tests that need full router context (e.g., sort tests) use RouterProvider directly.
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({ children, to, params, ...props }: { children?: React.ReactNode; to?: string; params?: Record<string, string>; [key: string]: unknown }) => {
      const href = to ?? '#'
      return React.createElement('a', { href, ...props }, children)
    },
  }
})

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
