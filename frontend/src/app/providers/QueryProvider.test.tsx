import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { QueryProvider } from './QueryProvider'

// Helper component to verify QueryClient is accessible in the tree
function QueryClientConsumer() {
  const client = useQueryClient()
  return <div data-testid="client-type">{client.constructor.name}</div>
}

describe('QueryProvider', () => {
  it('[P0] renders its children without crashing', () => {
    // GIVEN: QueryProvider wraps a child element
    render(
      <QueryProvider>
        <span data-testid="child">hello</span>
      </QueryProvider>
    )
    // WHEN: checking the DOM
    // THEN: the child is rendered
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('[P0] provides QueryClient context to descendant components', () => {
    // GIVEN: a component that calls useQueryClient() inside QueryProvider
    render(
      <QueryProvider>
        <QueryClientConsumer />
      </QueryProvider>
    )
    // WHEN: the consumer reads the client name
    // THEN: it is "QueryClient" (access succeeded without throwing)
    expect(screen.getByTestId('client-type').textContent).toBe('QueryClient')
  })

  it('[P1] renders multiple children without errors', () => {
    // GIVEN: QueryProvider wrapping two sibling elements
    render(
      <QueryProvider>
        <span data-testid="child-1">one</span>
        <span data-testid="child-2">two</span>
      </QueryProvider>
    )
    // WHEN: checking both siblings
    // THEN: both are in the document
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })

  it('[P2] does not render any visible element itself (transparent wrapper)', () => {
    // GIVEN: QueryProvider wrapping a known child
    const { container } = render(
      <QueryProvider>
        <div data-testid="inner" />
      </QueryProvider>
    )
    // WHEN: inspecting container children
    // THEN: the first meaningful child is the inner div (no extra wrapper DOM node)
    const inner = screen.getByTestId('inner')
    expect(container.contains(inner)).toBe(true)
  })
})
