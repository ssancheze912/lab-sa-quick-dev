/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Component Tests — EmptyState shared component (Vitest + RTL)
 *
 * Acceptance Criteria covered:
 *   AC3 — EmptyState renders with title and description when no clients exist
 *
 * RED phase: These tests fail because:
 *   - EmptyState component does not exist yet at
 *     frontend/src/shared/components/EmptyState.tsx
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Lazy import — will fail (RED) until EmptyState is implemented ────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let EmptyState: any

describe('EmptyState component', () => {
  beforeAll(async () => {
    const mod = await import('../EmptyState')
    EmptyState = mod.EmptyState ?? mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC3 — Renders title prop
  // ─────────────────────────────────────────────────────────────────────────

  it('Given the EmptyState component, When rendered with a title, Then the title text is visible', () => {
    // GIVEN: EmptyState component with a title prop
    render(<EmptyState title="Sin clientes" data-testid="empty-state" />)

    // THEN: the title text is displayed
    expect(screen.getByText('Sin clientes')).toBeDefined()
  })

  it('Given the EmptyState component, When rendered with a description, Then the description is visible', () => {
    // GIVEN: EmptyState with title and description
    render(
      <EmptyState
        title="Sin clientes"
        description="Aún no hay clientes registrados. Crea el primero."
        data-testid="empty-state"
      />,
    )

    // THEN: both title and description are visible
    expect(screen.getByText('Sin clientes')).toBeDefined()
    expect(screen.getByText('Aún no hay clientes registrados. Crea el primero.')).toBeDefined()
  })

  it('Given the EmptyState component, When rendered without description, Then only title is shown without error', () => {
    // GIVEN: EmptyState with title only (description is optional)
    render(<EmptyState title="Sin clientes" />)

    // THEN: title renders without throwing
    expect(screen.getByText('Sin clientes')).toBeDefined()
  })

  it('Given the EmptyState component, When rendered with an action slot, Then the action is rendered', () => {
    // GIVEN: EmptyState with an action (CTA) element
    render(
      <EmptyState
        title="Sin clientes"
        action={<button data-testid="empty-state-action">Crear cliente</button>}
      />,
    )

    // THEN: the action button is visible
    expect(screen.getByTestId('empty-state-action')).toBeDefined()
    expect(screen.getByText('Crear cliente')).toBeDefined()
  })

  it('Given the EmptyState component, When rendered with data-testid, Then it can be queried by testid', () => {
    // GIVEN: EmptyState with data-testid attribute
    render(<EmptyState title="Sin clientes" data-testid="empty-state" />)

    // THEN: the element is queryable by testid
    expect(screen.getByTestId('empty-state')).toBeDefined()
  })
})
