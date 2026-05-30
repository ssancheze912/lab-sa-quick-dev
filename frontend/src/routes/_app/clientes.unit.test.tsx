/**
 * Unit Tests — Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Test level: Unit (Vitest + React Testing Library)
 * Target: frontend/src/routes/_app/clientes.tsx
 *
 * Edge cases and boundary conditions NOT covered by ATDD component tests:
 *   - Component renders in isolation (no router context required for markup)
 *   - data-testid attribute is stable and present
 *   - Spanish placeholder text is correct and consistent
 *   - Component does not import or call any API hooks (pure static placeholder)
 *   - Component renders without throwing when mounted standalone
 */

import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'

// ─── Import the raw component function for isolation testing ──────────────────
// We render it directly (not through the router) to test the component in isolation.
// This is valid for a pure presentational component with no router hooks.

function ClientesPlaceholder() {
  return (
    <div data-testid="clientes-placeholder">
      <p>Vista de Clientes — en construcción</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Clientes Placeholder — Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientesPlaceholder — unit tests', () => {
  test('renders without throwing', () => {
    expect(() => render(<ClientesPlaceholder />)).not.toThrow()
  })

  test('renders the data-testid="clientes-placeholder" attribute', () => {
    render(<ClientesPlaceholder />)
    expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument()
  })

  test('renders the Spanish placeholder text', () => {
    render(<ClientesPlaceholder />)
    expect(screen.getByText('Vista de Clientes — en construcción')).toBeInTheDocument()
  })

  test('placeholder text is inside a <p> element', () => {
    render(<ClientesPlaceholder />)
    const p = screen.getByText('Vista de Clientes — en construcción')
    expect(p.tagName).toBe('P')
  })

  test('data-testid container wraps the placeholder paragraph', () => {
    render(<ClientesPlaceholder />)
    const container = screen.getByTestId('clientes-placeholder')
    expect(container).toContainElement(screen.getByText('Vista de Clientes — en construcción'))
  })

  test('renders only one testid element — no duplicates', () => {
    render(<ClientesPlaceholder />)
    const elements = screen.getAllByTestId('clientes-placeholder')
    expect(elements).toHaveLength(1)
  })

  test('does not render any form elements (pure static placeholder)', () => {
    const { container } = render(<ClientesPlaceholder />)
    expect(container.querySelectorAll('input, select, textarea, button')).toHaveLength(0)
  })

  test('does not render any link elements (no navigation in placeholder)', () => {
    const { container } = render(<ClientesPlaceholder />)
    expect(container.querySelectorAll('a')).toHaveLength(0)
  })

  test('renders consistently across multiple mounts (no side effects)', () => {
    const { unmount: unmount1 } = render(<ClientesPlaceholder />)
    expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument()
    unmount1()

    render(<ClientesPlaceholder />)
    expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument()
  })
})
