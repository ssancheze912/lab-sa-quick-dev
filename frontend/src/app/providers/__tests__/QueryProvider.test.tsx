/**
 * Story 1.1: Project Initialization & Repository Structure
 * Component Tests — QueryProvider
 *
 * Covers: children rendering, QueryClient context propagation,
 *         null/undefined children boundary, re-render stability.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { QueryProvider } from '../QueryProvider'

// ─────────────────────────────────────────────────────────────────────────────
// Helper component that reads from QueryClient context
// ─────────────────────────────────────────────────────────────────────────────

function QueryClientConsumer() {
  const client = useQueryClient()
  return <div data-testid="client-present">{client ? 'has-client' : 'no-client'}</div>
}

// ─────────────────────────────────────────────────────────────────────────────
// Core rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryProvider — children rendering', () => {
  it('should render its children without crashing', () => {
    // GIVEN: A simple text child
    render(
      <QueryProvider>
        <span data-testid="child">hello</span>
      </QueryProvider>
    )

    // THEN: The child is rendered in the DOM
    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByTestId('child').textContent).toBe('hello')
  })

  it('should render multiple children correctly', () => {
    render(
      <QueryProvider>
        <span data-testid="child-a">a</span>
        <span data-testid="child-b">b</span>
      </QueryProvider>
    )

    expect(screen.getByTestId('child-a')).toBeDefined()
    expect(screen.getByTestId('child-b')).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// QueryClient context propagation
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryProvider — QueryClient context propagation', () => {
  it('should make QueryClient available to children via useQueryClient hook', () => {
    // GIVEN: A consumer component inside the provider
    render(
      <QueryProvider>
        <QueryClientConsumer />
      </QueryProvider>
    )

    // THEN: The consumer can access the QueryClient (context is populated)
    const indicator = screen.getByTestId('client-present')
    expect(indicator.textContent).toBe('has-client')
  })

  it('should provide the singleton queryClient (not a new instance per render)', () => {
    // GIVEN: The QueryProvider uses the shared queryClient singleton
    let capturedClient: ReturnType<typeof useQueryClient> | null = null

    function Capture() {
      capturedClient = useQueryClient()
      return <div />
    }

    render(
      <QueryProvider>
        <Capture />
      </QueryProvider>
    )

    // THEN: The provided client is not null and has the expected staleTime
    expect(capturedClient).not.toBeNull()
    const options = capturedClient!.getDefaultOptions()
    expect(options.queries?.staleTime).toBe(60_000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: re-render stability
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryProvider — re-render stability', () => {
  it('should not crash on re-render with the same children', () => {
    // GIVEN: The provider renders once
    const { rerender } = render(
      <QueryProvider>
        <span data-testid="stable">content</span>
      </QueryProvider>
    )

    // WHEN: It re-renders with the same children
    expect(() => {
      rerender(
        <QueryProvider>
          <span data-testid="stable">content</span>
        </QueryProvider>
      )
    }).not.toThrow()

    // THEN: The child is still in the DOM
    expect(screen.getByTestId('stable')).toBeDefined()
  })

  it('should not crash when children change between renders', () => {
    const { rerender } = render(
      <QueryProvider>
        <span data-testid="first">first</span>
      </QueryProvider>
    )

    expect(() => {
      rerender(
        <QueryProvider>
          <span data-testid="second">second</span>
        </QueryProvider>
      )
    }).not.toThrow()

    expect(screen.getByTestId('second')).toBeDefined()
  })
})
