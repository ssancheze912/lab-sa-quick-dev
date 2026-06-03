/**
 * Story 1.1: Project Initialization & Repository Structure
 * Component Tests — QueryProvider
 *
 * Covers:
 *   - QueryProvider renders children without crashing
 *   - Children can access the QueryClient context (useQueryClient hook resolves)
 *   - QueryProvider is composable (nested elements render correctly)
 *   - QueryProvider does NOT render extra DOM wrapper elements
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { QueryProvider } from '../QueryProvider'

// ─── Helper component to probe QueryClient context ──────────────────────────

function QueryClientProbe() {
  const client = useQueryClient()
  return <div data-testid="probe">{client ? 'has-client' : 'no-client'}</div>
}

describe('QueryProvider — component tests', () => {
  it('should render children without throwing', () => {
    // GIVEN: QueryProvider wraps a simple child element
    // WHEN: Rendered in the test environment
    // THEN: No exceptions are thrown and the child is visible
    expect(() =>
      render(
        <QueryProvider>
          <span data-testid="child">hello</span>
        </QueryProvider>
      )
    ).not.toThrow()

    expect(screen.getByTestId('child')).toBeDefined()
  })

  it('should provide a QueryClient accessible to child components via useQueryClient', () => {
    // GIVEN: A child uses the useQueryClient() hook
    // WHEN: The child is wrapped by QueryProvider
    // THEN: The hook resolves to a QueryClient instance (not null/undefined)
    render(
      <QueryProvider>
        <QueryClientProbe />
      </QueryProvider>
    )

    expect(screen.getByTestId('probe').textContent).toBe('has-client')
  })

  it('should render multiple children without issues', () => {
    // GIVEN: QueryProvider wraps more than one child element
    // WHEN: Rendered
    // THEN: All children are present in the DOM
    render(
      <QueryProvider>
        <div data-testid="first">first</div>
        <div data-testid="second">second</div>
      </QueryProvider>
    )

    expect(screen.getByTestId('first')).toBeDefined()
    expect(screen.getByTestId('second')).toBeDefined()
  })

  it('should not add extra DOM wrapper elements around children', () => {
    // GIVEN: A single child div
    // WHEN: Rendered inside QueryProvider
    // THEN: The child is a direct child of the container (no extra wrapper divs)
    const { container } = render(
      <QueryProvider>
        <div id="only-child">content</div>
      </QueryProvider>
    )

    const onlyChild = container.querySelector('#only-child')
    expect(onlyChild).not.toBeNull()
    // QueryClientProvider renders no extra DOM — child's parent is the container
    expect(onlyChild?.parentElement).toBe(container)
  })

  it('should render children passed as a string node', () => {
    // Boundary: ReactNode includes string primitives
    // GIVEN: A string is the child
    // THEN: QueryProvider accepts it without error
    expect(() =>
      render(<QueryProvider>{'plain text child'}</QueryProvider>)
    ).not.toThrow()
  })
})
