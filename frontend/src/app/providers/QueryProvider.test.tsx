import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { QueryProvider } from './QueryProvider'
import { queryClient } from '@/shared/lib/queryClient'

/**
 * Component tests for QueryProvider
 *
 * Validates that the QueryProvider correctly wraps children with the
 * configured queryClient singleton — a prerequisite for any subsequent
 * story that consumes useQuery / useMutation hooks (FR / NFR / Story 2.x+).
 */
describe('QueryProvider', () => {
  it('[P1] should render children without throwing', () => {
    // GIVEN: A child component
    // WHEN: Wrapping it in <QueryProvider>
    render(
      <QueryProvider>
        <div data-testid="child">Hello from child</div>
      </QueryProvider>,
    )

    // THEN: The child renders unchanged
    expect(screen.getByTestId('child')).toHaveTextContent('Hello from child')
  })

  it('[P1] should provide the application queryClient singleton to descendants', () => {
    // GIVEN: A consumer that reads the queryClient via the hook
    function Consumer() {
      const client = useQueryClient()
      return (
        <span data-testid="consumer-stale-time">
          {String(client.getDefaultOptions().queries?.staleTime)}
        </span>
      )
    }

    // WHEN: Mounting it under the provider
    render(
      <QueryProvider>
        <Consumer />
      </QueryProvider>,
    )

    // THEN: The consumer reads the same singleton (60_000 ms staleTime)
    expect(screen.getByTestId('consumer-stale-time')).toHaveTextContent('60000')
  })

  it('[P2] should expose the exact same QueryClient instance as the shared module', () => {
    // GIVEN: A consumer that reads the queryClient instance via the hook
    let exposedClient: ReturnType<typeof useQueryClient> | undefined
    function Capturer() {
      exposedClient = useQueryClient()
      return null
    }

    // WHEN: Mounted under the provider
    render(
      <QueryProvider>
        <Capturer />
      </QueryProvider>,
    )

    // THEN: The exposed client IS the shared singleton (no accidental new instance)
    expect(exposedClient).toBe(queryClient)
  })

  it('[P2] should render multiple children unchanged (no wrapper mutation)', () => {
    // GIVEN: Multiple sibling children
    // WHEN: Wrapping them
    render(
      <QueryProvider>
        <p data-testid="p1">first</p>
        <p data-testid="p2">second</p>
      </QueryProvider>,
    )

    // THEN: Both children render and retain their content
    expect(screen.getByTestId('p1')).toHaveTextContent('first')
    expect(screen.getByTestId('p2')).toHaveTextContent('second')
  })
})
