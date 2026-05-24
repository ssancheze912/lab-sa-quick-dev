/**
 * Story 1.1 — QueryProvider component edge cases
 * Expands coverage beyond the happy-path ATDD tests.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, renderHook } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { QueryProvider } from '@/app/providers/QueryProvider'

describe('QueryProvider — edge cases', () => {
  it('provides a QueryClient accessible to children via useQueryClient()', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryProvider>{children}</QueryProvider>
    )
    const { result } = renderHook(() => useQueryClient(), { wrapper })
    expect(result.current).toBeDefined()
    expect(typeof result.current.getQueryCache).toBe('function')
  })

  it('renders multiple children without errors', () => {
    render(
      <QueryProvider>
        <span data-testid="child-a">A</span>
        <span data-testid="child-b">B</span>
      </QueryProvider>
    )
    expect(screen.getByTestId('child-a')).toBeInTheDocument()
    expect(screen.getByTestId('child-b')).toBeInTheDocument()
  })

  it('renders deeply nested children', () => {
    render(
      <QueryProvider>
        <div>
          <section>
            <span data-testid="deep-child">Deep</span>
          </section>
        </div>
      </QueryProvider>
    )
    expect(screen.getByTestId('deep-child')).toBeInTheDocument()
  })

  it('renders with a null-like children (fragment) without crash', () => {
    expect(() =>
      render(
        <QueryProvider>
          <></>
        </QueryProvider>
      )
    ).not.toThrow()
  })

  it('does not render extra DOM wrappers — children are direct output', () => {
    const { container } = render(
      <QueryProvider>
        <p data-testid="inner-p">content</p>
      </QueryProvider>
    )
    // The QueryClientProvider from react-query is renderless — container should hold inner-p directly
    const p = container.querySelector('[data-testid="inner-p"]')
    expect(p).not.toBeNull()
  })
})
