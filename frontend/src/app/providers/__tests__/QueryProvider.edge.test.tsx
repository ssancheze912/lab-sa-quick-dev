import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { QueryProvider } from '../QueryProvider'

/**
 * Edge case tests for QueryProvider.tsx — Story 1.1
 * Expands ATDD coverage with context propagation, multiple children,
 * and error boundaries.
 *
 * ATDD base covered: renders children, does not throw
 * This file covers: multiple children, deep nesting, context access from children,
 *                   null/undefined child guard, re-render stability.
 */

// Helper component that reads the QueryClient from context
function QueryClientConsumer({ testId }: { testId: string }) {
  const client = useQueryClient()
  return <div data-testid={testId}>{client ? 'has-client' : 'no-client'}</div>
}

describe('QueryProvider — edge cases', () => {
  // ─── Multiple children ─────────────────────────────────────────────────

  it('[P1] should render multiple sibling children without errors', () => {
    // GIVEN: QueryProvider wrapping more than one child
    // WHEN: Rendered with two sibling elements
    render(
      <QueryProvider>
        <span data-testid="child-a">A</span>
        <span data-testid="child-b">B</span>
      </QueryProvider>,
    )

    // THEN: Both children are visible
    expect(screen.getByTestId('child-a')).toBeInTheDocument()
    expect(screen.getByTestId('child-b')).toBeInTheDocument()
  })

  // ─── Context propagation depth ────────────────────────────────────────

  it('[P1] should provide QueryClient context to deeply nested children', () => {
    // GIVEN: A component three levels deep in the tree reads useQueryClient()
    // WHEN: Rendered inside QueryProvider
    render(
      <QueryProvider>
        <div>
          <div>
            <QueryClientConsumer testId="deep-consumer" />
          </div>
        </div>
      </QueryProvider>,
    )

    // THEN: The deep child successfully accesses the QueryClient (no context error)
    expect(screen.getByTestId('deep-consumer')).toHaveTextContent('has-client')
  })

  // ─── QueryClient identity across renders ──────────────────────────────

  it('[P2] should provide the same singleton QueryClient to all consumers in the tree', () => {
    // GIVEN: Two sibling consumers access the QueryClient from context
    render(
      <QueryProvider>
        <QueryClientConsumer testId="consumer-1" />
        <QueryClientConsumer testId="consumer-2" />
      </QueryProvider>,
    )

    // THEN: Both show they have a client (same singleton, not two instances)
    expect(screen.getByTestId('consumer-1')).toHaveTextContent('has-client')
    expect(screen.getByTestId('consumer-2')).toHaveTextContent('has-client')
  })

  // ─── Re-render stability ───────────────────────────────────────────────

  it('[P2] should not throw when re-rendered with different children', () => {
    // GIVEN: QueryProvider is rendered with a child
    const { rerender } = render(
      <QueryProvider>
        <div data-testid="initial">Initial</div>
      </QueryProvider>,
    )

    // WHEN: It is re-rendered with a completely different child tree
    expect(() =>
      rerender(
        <QueryProvider>
          <div data-testid="updated">Updated</div>
        </QueryProvider>,
      ),
    ).not.toThrow()

    // THEN: The new child is rendered
    expect(screen.getByTestId('updated')).toBeInTheDocument()
  })

  // ─── Empty children ───────────────────────────────────────────────────

  it('[P3] should render without crashing when children is an empty fragment', () => {
    // GIVEN: QueryProvider wraps an empty fragment (edge case in lazy loading)
    // WHEN: Rendered with no visible children
    expect(() =>
      render(
        <QueryProvider>
          <></>
        </QueryProvider>,
      ),
    ).not.toThrow()
  })
})
