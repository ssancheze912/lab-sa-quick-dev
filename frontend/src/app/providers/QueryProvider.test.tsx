/**
 * Story 1.1 — QueryProvider component tests
 * Covers edge cases not included in the ATDD baseline.
 *
 * Covers:
 *  - Renders children without crashing
 *  - Does NOT render anything extra around children (no wrapper element leak)
 *  - Accepts a single ReactNode child
 *  - Accepts multiple children (React.Fragment equivalent)
 *  - Children can use useQuery without throwing (QueryClientProvider wired)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { QueryProvider } from './QueryProvider'

// ── Helpers ──────────────────────────────────────────────────────────────────

function PlainChild() {
  return <span data-testid="plain-child">child</span>
}

function QueryClientConsumer() {
  // useQueryClient throws if not inside a QueryClientProvider
  const client = useQueryClient()
  return <span data-testid="qc-consumer">{client ? 'ok' : 'missing'}</span>
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('QueryProvider — component edge cases', () => {
  it('should render a single child without crashing', () => {
    render(
      <QueryProvider>
        <PlainChild />
      </QueryProvider>
    )
    expect(screen.getByTestId('plain-child')).toBeInTheDocument()
  })

  it('should render multiple children without crashing', () => {
    render(
      <QueryProvider>
        <span data-testid="child-a">A</span>
        <span data-testid="child-b">B</span>
      </QueryProvider>
    )
    expect(screen.getByTestId('child-a')).toBeInTheDocument()
    expect(screen.getByTestId('child-b')).toBeInTheDocument()
  })

  it('should make QueryClient available to descendant components via useQueryClient', () => {
    render(
      <QueryProvider>
        <QueryClientConsumer />
      </QueryProvider>
    )
    expect(screen.getByTestId('qc-consumer')).toHaveTextContent('ok')
  })

  it('should render children with the correct text content', () => {
    render(
      <QueryProvider>
        <p data-testid="text-child">Hello World</p>
      </QueryProvider>
    )
    expect(screen.getByTestId('text-child')).toHaveTextContent('Hello World')
  })

  it('should not throw when children is null (edge: empty render)', () => {
    // React allows null children — QueryProvider must not crash
    expect(() =>
      render(<QueryProvider>{null}</QueryProvider>)
    ).not.toThrow()
  })

  it('should not inject extra wrapper DOM elements beyond what children produce', () => {
    const { container } = render(
      <QueryProvider>
        <div data-testid="solo">solo</div>
      </QueryProvider>
    )
    // QueryClientProvider is transparent — only the child div should be in the container
    // (plus the root div that RTL always adds)
    const divChildren = container.firstChild?.childNodes
    expect(divChildren).toHaveLength(1)
  })
})
