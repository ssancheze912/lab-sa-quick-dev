/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — QueryProvider Edge Cases & Boundary Conditions
 * Expands the basic QueryProvider mount test with context availability,
 * nested rendering, and re-render stability scenarios.
 *
 * Coverage:
 *   AC1 — QueryProvider wraps the app correctly (React context availability)
 *   AC4 — No TypeScript/React errors when QueryProvider mounts/unmounts
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { QueryProvider } from '../app/providers/QueryProvider'

// ─────────────────────────────────────────────────────────────────────────────
// QueryProvider edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryProvider edge cases', () => {
  it('[P1] should make QueryClient available via useQueryClient hook in children', () => {
    // GIVEN: QueryProvider is mounted with a child that uses the query context
    let capturedClient: unknown = null

    const ChildConsumer = () => {
      const client = useQueryClient()
      capturedClient = client
      return <span data-testid="consumer">mounted</span>
    }

    // WHEN: QueryProvider wraps the consumer component
    render(
      <QueryProvider>
        <ChildConsumer />
      </QueryProvider>
    )

    // THEN: The child receives a valid QueryClient via context
    expect(screen.getByTestId('consumer')).toBeInTheDocument()
    expect(capturedClient).not.toBeNull()
    expect(capturedClient).toBeDefined()
  })

  it('[P1] should render multiple children simultaneously without errors', () => {
    // GIVEN: A real app has multiple sibling components as children
    // WHEN: QueryProvider wraps multiple children
    render(
      <QueryProvider>
        <span data-testid="child-1">first</span>
        <span data-testid="child-2">second</span>
        <span data-testid="child-3">third</span>
      </QueryProvider>
    )

    // THEN: All children are rendered correctly
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
    expect(screen.getByTestId('child-3')).toBeInTheDocument()
  })

  it('[P1] should render nested QueryProvider consumers without context conflicts', () => {
    // GIVEN: Deep component trees where children may also consume the QueryClient
    let outerClient: unknown = null
    let innerClient: unknown = null

    const InnerConsumer = () => {
      innerClient = useQueryClient()
      return <span data-testid="inner">inner</span>
    }

    const OuterConsumer = () => {
      outerClient = useQueryClient()
      return (
        <div data-testid="outer">
          outer
          <InnerConsumer />
        </div>
      )
    }

    // WHEN: Both outer and inner components consume the QueryClient from the same provider
    render(
      <QueryProvider>
        <OuterConsumer />
      </QueryProvider>
    )

    // THEN: Both consumers receive the same QueryClient instance
    expect(outerClient).not.toBeNull()
    expect(innerClient).not.toBeNull()
    expect(outerClient).toBe(innerClient) // Same singleton
  })

  it('[P2] should render null children without crashing', () => {
    // GIVEN: Some conditional renders may produce null children
    // WHEN: QueryProvider wraps a null-rendered child
    const ConditionalChild = ({ show }: { show: boolean }) => {
      return show ? <span data-testid="conditional">visible</span> : null
    }

    const { rerender } = render(
      <QueryProvider>
        <ConditionalChild show={false} />
      </QueryProvider>
    )

    // THEN: No children visible initially
    expect(screen.queryByTestId('conditional')).not.toBeInTheDocument()

    // WHEN: The condition changes to true
    rerender(
      <QueryProvider>
        <ConditionalChild show={true} />
      </QueryProvider>
    )

    // THEN: The child appears without errors
    expect(screen.getByTestId('conditional')).toBeInTheDocument()
  })

  it('[P2] should remain stable across multiple re-renders', () => {
    // GIVEN: QueryProvider may re-render when parent state changes
    const renderCount = { value: 0 }

    const CountingChild = () => {
      renderCount.value++
      return <span data-testid="counting">{renderCount.value}</span>
    }

    const { rerender } = render(
      <QueryProvider>
        <CountingChild />
      </QueryProvider>
    )

    const initialRenderCount = renderCount.value

    // WHEN: The provider is re-rendered (parent state update simulation)
    rerender(
      <QueryProvider>
        <CountingChild />
      </QueryProvider>
    )

    // THEN: The child re-renders without errors (render count increases by 1)
    expect(renderCount.value).toBeGreaterThan(initialRenderCount)
    expect(screen.getByTestId('counting')).toBeInTheDocument()
  })

  it('[P2] should not throw when unmounting (cleanup is handled by react-query)', () => {
    // GIVEN: QueryProvider is mounted
    const { unmount } = render(
      <QueryProvider>
        <span>content</span>
      </QueryProvider>
    )

    // WHEN: The provider is unmounted (user navigates away from the entire app)
    // THEN: No errors are thrown during cleanup
    expect(() => unmount()).not.toThrow()
  })
})
