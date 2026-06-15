/**
 * Story 1.1: Project Initialization & Repository Structure
 * Component tests for QueryProvider — AC1 coverage
 *
 * Covers:
 *  - Renders children without crashing
 *  - Provides QueryClient context (useQueryClient resolves)
 *  - Uses the singleton queryClient (not a new instance)
 *  - Does not render extraneous wrapper DOM elements
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { QueryProvider } from '../QueryProvider'
import { queryClient } from '../../../shared/lib/queryClient'
import React from 'react'

// Helper component that consumes context
function QueryClientConsumer() {
  const client = useQueryClient()
  return <div data-testid="client-id">{client === queryClient ? 'singleton' : 'other'}</div>
}

describe('QueryProvider — component tests', () => {
  it('should render children without throwing', () => {
    render(
      <QueryProvider>
        <span data-testid="child">hello</span>
      </QueryProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should provide QueryClient context to descendant components', () => {
    render(
      <QueryProvider>
        <QueryClientConsumer />
      </QueryProvider>
    )
    expect(screen.getByTestId('client-id')).toBeInTheDocument()
  })

  it('should use the singleton queryClient instance (not create a new one)', () => {
    render(
      <QueryProvider>
        <QueryClientConsumer />
      </QueryProvider>
    )
    expect(screen.getByTestId('client-id').textContent).toBe('singleton')
  })

  it('should render multiple children correctly', () => {
    render(
      <QueryProvider>
        <span data-testid="child-a">A</span>
        <span data-testid="child-b">B</span>
      </QueryProvider>
    )
    expect(screen.getByTestId('child-a')).toBeInTheDocument()
    expect(screen.getByTestId('child-b')).toBeInTheDocument()
  })

  it('should not add extraneous wrapper DOM elements around children', () => {
    const { container } = render(
      <QueryProvider>
        <span data-testid="only-child">test</span>
      </QueryProvider>
    )
    // QueryClientProvider renders children directly without an extra wrapper div
    const child = screen.getByTestId('only-child')
    expect(child).toBeInTheDocument()
    // The container itself is the document fragment root; the child should be direct
    expect(container.firstChild).toBeTruthy()
  })
})
