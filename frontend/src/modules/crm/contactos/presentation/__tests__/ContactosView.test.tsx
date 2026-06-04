/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — ContactosView placeholder component
 *
 * Edge cases and boundary conditions not covered by ATDD:
 *   - Component renders in isolation (no router context required)
 *   - Correct semantic HTML structure (main element)
 *   - data-testid attribute presence for E2E selectors
 *   - No unexpected children or extra nodes
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContactosView } from '../ContactosView'

describe('ContactosView — unit', () => {
  it('should render without crashing in isolation (no router context)', () => {
    // GIVEN: No router context wrapping
    // WHEN: Component is rendered directly
    const { container } = render(<ContactosView />)

    // THEN: The component mounts without errors
    expect(container).toBeTruthy()
  })

  it('should render a <main> element as the root node', () => {
    // GIVEN: The component renders
    render(<ContactosView />)

    // THEN: A <main> landmark is present (semantic HTML)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('should have the data-testid="contactos-view" attribute on root element', () => {
    // GIVEN: The component renders
    render(<ContactosView />)

    // THEN: The root element has the expected testid for Playwright E2E selectors
    expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
  })

  it('should display the Spanish placeholder text', () => {
    // GIVEN: The component renders
    render(<ContactosView />)

    // THEN: The placeholder text in Spanish is displayed
    expect(screen.getByText('Vista de Contactos (próximamente)')).toBeInTheDocument()
  })

  it('should render exactly one <main> element (no duplicate landmarks)', () => {
    // GIVEN: The component renders
    render(<ContactosView />)

    // THEN: There is only one main landmark
    const mains = screen.getAllByRole('main')
    expect(mains).toHaveLength(1)
  })

  it('should contain the placeholder text inside the main element', () => {
    // GIVEN: The component renders
    render(<ContactosView />)

    // THEN: The text is a descendant of the main element
    const main = screen.getByRole('main')
    expect(main).toHaveTextContent('Vista de Contactos (próximamente)')
  })
})
