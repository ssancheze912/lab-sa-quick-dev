// Story 2.1: Client List & Search — Automate expansion
// Unit tests for EmptyState shared component
// Coverage: rendering, props, content variants
// Level: Component/Unit | Priority: P1-P2

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

// ---------------------------------------------------------------------------
// [P1] data-testid presence
// ---------------------------------------------------------------------------
describe('EmptyState — [P1] testid', () => {
  it('When rendered Then data-testid="empty-state" is present', () => {
    render(<EmptyState />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// [P1] title / message prop rendered
// ---------------------------------------------------------------------------
describe('EmptyState — [P1] title and message props', () => {
  it('Given title prop When rendered Then title text is displayed', () => {
    render(<EmptyState title="No hay clientes registrados" />)
    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
  })

  it('Given message prop (legacy alias) When rendered Then message text is displayed', () => {
    render(<EmptyState message="Sin elementos disponibles" />)
    expect(screen.getByText('Sin elementos disponibles')).toBeInTheDocument()
  })

  it('Given title and message When rendered Then title takes precedence', () => {
    render(<EmptyState title="Título principal" message="Fallback message" />)
    expect(screen.getByText('Título principal')).toBeInTheDocument()
    expect(screen.queryByText('Fallback message')).not.toBeInTheDocument()
  })

  it('Given neither title nor message When rendered Then fallback text "Sin elementos" is shown', () => {
    render(<EmptyState />)
    expect(screen.getByText('Sin elementos')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// [P1] description prop
// ---------------------------------------------------------------------------
describe('EmptyState — [P1] description prop', () => {
  it('Given description prop When rendered Then description text is visible', () => {
    render(
      <EmptyState
        title="No hay clientes"
        description="Crea el primer cliente para comenzar"
      />,
    )
    expect(screen.getByText('Crea el primer cliente para comenzar')).toBeInTheDocument()
  })

  it('Given no description When rendered Then no secondary text appears', () => {
    render(<EmptyState title="No hay clientes" />)
    // No extra paragraphs for description
    const emptyState = screen.getByTestId('empty-state')
    // Only the title paragraph
    expect(emptyState.querySelectorAll('p')).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// [P1] Icon is present (aria-hidden)
// ---------------------------------------------------------------------------
describe('EmptyState — [P1] icon accessibility', () => {
  it('Given rendered When inspected Then the icon svg has aria-hidden="true"', () => {
    render(<EmptyState title="No hay clientes" />)
    const svg = screen.getByTestId('empty-state').querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})

// ---------------------------------------------------------------------------
// [P2] Centered layout classes
// AC task 18: centered layout with slate-100 background area
// ---------------------------------------------------------------------------
describe('EmptyState — [P2] layout classes', () => {
  it('When rendered Then root has flex and items-center for centering', () => {
    render(<EmptyState title="Test" />)
    const root = screen.getByTestId('empty-state')
    expect(root.className).toContain('flex')
    expect(root.className).toContain('items-center')
  })

  it('When rendered Then root has bg-slate-100 background', () => {
    render(<EmptyState title="Test" />)
    const root = screen.getByTestId('empty-state')
    expect(root.className).toContain('bg-slate-100')
  })
})

// ---------------------------------------------------------------------------
// [P2] Spanish text by default when used in story context
// Architecture constraint: all user-facing text in Spanish
// ---------------------------------------------------------------------------
describe('EmptyState — [P2] Spanish text compliance', () => {
  it('Given the standard story title When rendered Then text is in Spanish', () => {
    render(
      <EmptyState
        title="No hay clientes registrados"
        description="Crea el primer cliente para comenzar"
      />,
    )
    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
    expect(screen.getByText('Crea el primer cliente para comenzar')).toBeInTheDocument()
  })
})
