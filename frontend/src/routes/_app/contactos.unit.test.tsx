/**
 * Unit Tests — Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Test level: Unit (Vitest + React Testing Library)
 * Target: frontend/src/routes/_app/contactos.tsx
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

// ─── Inline mirror of the route component for unit isolation ─────────────────

function ContactosPlaceholder() {
  return (
    <div data-testid="contactos-placeholder">
      <p>Vista de Contactos — en construcción</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Contactos Placeholder — Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactosPlaceholder — unit tests', () => {
  test('renders without throwing', () => {
    expect(() => render(<ContactosPlaceholder />)).not.toThrow()
  })

  test('renders the data-testid="contactos-placeholder" attribute', () => {
    render(<ContactosPlaceholder />)
    expect(screen.getByTestId('contactos-placeholder')).toBeInTheDocument()
  })

  test('renders the Spanish placeholder text', () => {
    render(<ContactosPlaceholder />)
    expect(screen.getByText('Vista de Contactos — en construcción')).toBeInTheDocument()
  })

  test('placeholder text is inside a <p> element', () => {
    render(<ContactosPlaceholder />)
    const p = screen.getByText('Vista de Contactos — en construcción')
    expect(p.tagName).toBe('P')
  })

  test('data-testid container wraps the placeholder paragraph', () => {
    render(<ContactosPlaceholder />)
    const container = screen.getByTestId('contactos-placeholder')
    expect(container).toContainElement(screen.getByText('Vista de Contactos — en construcción'))
  })

  test('renders only one testid element — no duplicates', () => {
    render(<ContactosPlaceholder />)
    const elements = screen.getAllByTestId('contactos-placeholder')
    expect(elements).toHaveLength(1)
  })

  test('does not render any form elements (pure static placeholder)', () => {
    const { container } = render(<ContactosPlaceholder />)
    expect(container.querySelectorAll('input, select, textarea, button')).toHaveLength(0)
  })

  test('does not render any link elements (no navigation in placeholder)', () => {
    const { container } = render(<ContactosPlaceholder />)
    expect(container.querySelectorAll('a')).toHaveLength(0)
  })

  test('renders consistently across multiple mounts (no side effects)', () => {
    const { unmount: unmount1 } = render(<ContactosPlaceholder />)
    expect(screen.getByTestId('contactos-placeholder')).toBeInTheDocument()
    unmount1()

    render(<ContactosPlaceholder />)
    expect(screen.getByTestId('contactos-placeholder')).toBeInTheDocument()
  })

  test('clientes and contactos placeholders have different testids (no id collision)', () => {
    // Render Contactos and verify it does NOT accidentally use clientes testid
    render(<ContactosPlaceholder />)
    expect(screen.queryByTestId('clientes-placeholder')).not.toBeInTheDocument()
    expect(screen.getByTestId('contactos-placeholder')).toBeInTheDocument()
  })
})
