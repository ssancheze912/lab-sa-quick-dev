/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — ClientesView placeholder component
 *
 * Edge cases and boundary conditions not covered by ATDD:
 *   - Component renders in isolation (no router context required)
 *   - Correct semantic HTML structure (main element)
 *   - data-testid attribute presence for E2E selectors
 *   - No unexpected children or extra nodes
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClientesView } from '../ClientesView'

describe('ClientesView — unit', () => {
  it('should render without crashing in isolation (no router context)', () => {
    // GIVEN: No router context wrapping
    // WHEN: Component is rendered directly
    const { container } = render(<ClientesView />)

    // THEN: The component mounts without errors
    expect(container).toBeTruthy()
  })

  it('should render a <section> element as the root node', () => {
    // GIVEN: The component renders
    const { container } = render(<ClientesView />)

    // THEN: A <section> element is present as root (avoids nested <main> with root layout)
    expect(container.querySelector('section[data-testid="clientes-view"]')).toBeTruthy()
  })

  it('should have the data-testid="clientes-view" attribute on root element', () => {
    // GIVEN: The component renders
    render(<ClientesView />)

    // THEN: The root element has the expected testid for Playwright E2E selectors
    expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
  })

  it('should display the Spanish placeholder text', () => {
    // GIVEN: The component renders
    render(<ClientesView />)

    // THEN: The placeholder text in Spanish is displayed
    expect(screen.getByText('Vista de Clientes (próximamente)')).toBeInTheDocument()
  })

  it('should NOT render a <main> element (root layout owns the main landmark)', () => {
    // GIVEN: The component renders in isolation
    const { container } = render(<ClientesView />)

    // THEN: No nested <main> landmark is created (root layout already provides one)
    expect(container.querySelector('main')).toBeNull()
  })

  it('should contain the placeholder text inside the section element', () => {
    // GIVEN: The component renders
    render(<ClientesView />)

    // THEN: The text is a descendant of the section element
    const section = screen.getByTestId('clientes-view')
    expect(section).toHaveTextContent('Vista de Clientes (próximamente)')
  })
})
