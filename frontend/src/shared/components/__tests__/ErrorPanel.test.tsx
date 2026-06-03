/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Component Tests — ErrorPanel shared component (Vitest + RTL)
 *
 * Acceptance Criteria covered:
 *   AC4 — ErrorPanel renders with "Reintentar" button and calls onRetry callback
 *
 * RED phase: These tests fail because:
 *   - ErrorPanel component does not exist yet at
 *     frontend/src/shared/components/ErrorPanel.tsx
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ─── Lazy import — will fail (RED) until ErrorPanel is implemented ─────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ErrorPanel: any

describe('ErrorPanel component', () => {
  beforeAll(async () => {
    const mod = await import('../ErrorPanel')
    ErrorPanel = mod.ErrorPanel ?? mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC4 — "Reintentar" button renders and is clickable
  // ─────────────────────────────────────────────────────────────────────────

  it('Given the ErrorPanel component, When rendered, Then the "Reintentar" button is visible', () => {
    // GIVEN: ErrorPanel with an onRetry handler
    render(<ErrorPanel onRetry={() => {}} />)

    // THEN: the "Reintentar" button is present
    expect(screen.getByText('Reintentar')).toBeDefined()
  })

  it('Given the ErrorPanel, When the "Reintentar" button is clicked, Then onRetry callback is called', () => {
    // GIVEN: ErrorPanel with a mocked onRetry handler
    const onRetry = vi.fn()
    render(<ErrorPanel onRetry={onRetry} />)

    // WHEN: user clicks "Reintentar"
    const retryButton = screen.getByText('Reintentar')
    fireEvent.click(retryButton)

    // THEN: onRetry was called exactly once
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('Given the ErrorPanel, When rendered, Then the default Spanish error message is displayed', () => {
    // GIVEN: ErrorPanel without a custom message
    render(<ErrorPanel onRetry={() => {}} />)

    // THEN: default Spanish message is displayed
    expect(screen.getByText('No se pudieron cargar los datos')).toBeDefined()
  })

  it('Given the ErrorPanel, When rendered with a custom message, Then custom message overrides default', () => {
    // GIVEN: ErrorPanel with a custom message
    render(<ErrorPanel onRetry={() => {}} message="Error al cargar clientes" />)

    // THEN: custom message is displayed
    expect(screen.getByText('Error al cargar clientes')).toBeDefined()
  })

  it('Given the ErrorPanel, When rendered, Then raw error message or stack trace is NOT displayed', () => {
    // GIVEN: ErrorPanel rendered (as would appear after a fetch error)
    const { container } = render(<ErrorPanel onRetry={() => {}} />)

    // THEN: no stack trace text or internal error detail appears
    expect(container.textContent).not.toContain('Error:')
    expect(container.textContent).not.toContain('at ')
    expect(container.textContent).not.toContain('stackTrace')
  })

  it('Given the ErrorPanel, When rendered with data-testid, Then it can be queried by testid', () => {
    // GIVEN: ErrorPanel with data-testid attribute
    render(<ErrorPanel onRetry={() => {}} data-testid="error-panel" />)

    // THEN: the element is queryable by testid
    expect(screen.getByTestId('error-panel')).toBeDefined()
  })
})
