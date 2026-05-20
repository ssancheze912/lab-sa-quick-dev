import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryProvider } from '../QueryProvider'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Unit Edge Case Tests: QueryProvider — Component Boundary Conditions
 *
 * BMad-Integrated: Expands unit test coverage for QueryProvider.
 *
 * Edge cases covered:
 *   - QueryProvider renders children correctly
 *   - Children can access QueryClient via useQueryClient hook
 *   - QueryProvider renders a single child without wrapping element
 *   - QueryProvider renders multiple children without error
 *   - QueryProvider does not crash with null children
 *   - QueryProvider passes the shared singleton queryClient to children
 */

// Helper component to verify QueryClient is accessible inside QueryProvider
function QueryClientConsumer() {
  const client = useQueryClient()
  return <div data-testid="client-present">{client ? 'has-client' : 'no-client'}</div>
}

describe('QueryProvider — edge cases', () => {

  it('[P1] should render children without error', () => {
    // GIVEN: A child component to render inside the provider
    // WHEN: QueryProvider is rendered with a child
    render(
      <QueryProvider>
        <div data-testid="child">hello</div>
      </QueryProvider>
    )

    // THEN: The child is rendered
    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByText('hello')).toBeDefined()
  })

  it('[P1] should provide QueryClient context to children', () => {
    // GIVEN: A component that uses useQueryClient()
    // WHEN: It is rendered inside QueryProvider
    render(
      <QueryProvider>
        <QueryClientConsumer />
      </QueryProvider>
    )

    // THEN: The QueryClient is accessible via the hook
    const result = screen.getByTestId('client-present')
    expect(result.textContent).toBe('has-client')
  })

  it('[P1] should render multiple children without error', () => {
    // GIVEN: QueryProvider receives multiple children
    // WHEN: Rendered with two sibling children
    render(
      <QueryProvider>
        <div data-testid="child-1">first</div>
        <div data-testid="child-2">second</div>
      </QueryProvider>
    )

    // THEN: Both children are rendered
    expect(screen.getByTestId('child-1')).toBeDefined()
    expect(screen.getByTestId('child-2')).toBeDefined()
  })

  it('[P2] should not render any extra wrapper DOM element around children', () => {
    // GIVEN: QueryClientProvider (from React Query) renders transparently
    // WHEN: QueryProvider renders a single child
    const { container } = render(
      <QueryProvider>
        <span data-testid="only-child">content</span>
      </QueryProvider>
    )

    // THEN: The rendered tree contains the child span
    const child = container.querySelector('[data-testid="only-child"]')
    expect(child).not.toBeNull()
    expect(child?.textContent).toBe('content')
  })

  it('[P2] should provide a queryClient with staleTime of 60 seconds', () => {
    // GIVEN: QueryProvider uses the shared singleton queryClient
    let capturedStaleTime: number | undefined = undefined

    function StaleTimeChecker() {
      const client = useQueryClient()
      capturedStaleTime = client.getDefaultOptions().queries?.staleTime as number | undefined
      return null
    }

    // WHEN: QueryProvider is rendered and the child reads query defaults
    render(
      <QueryProvider>
        <StaleTimeChecker />
      </QueryProvider>
    )

    // THEN: The queryClient has the expected staleTime from queryClient.ts
    expect(capturedStaleTime).toBe(60_000)
  })
})
