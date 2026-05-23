/**
 * Story 2.1: Client List & Search
 * Component Tests — ClientListItem shared component (RED phase)
 *
 * Verifies the ClientListItem renders nombre + nit, applies selected styles,
 * calls onClick, and meets accessibility requirements.
 *
 * AC covered: #1 (list item renders Nombre as primary, NIT as secondary)
 *
 * STATUS: RED — ClientListItem.tsx does not exist yet.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// ClientListItem — rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — rendering', () => {
  it('should render the nombre prop as primary text', async () => {
    // GIVEN: A ClientListItem with nombre and nit
    const { ClientListItem } = await import('../ClientListItem')

    // WHEN: The component is rendered
    render(
      React.createElement(ClientListItem, {
        id: '1',
        nombre: 'Empresa ABC',
        nit: '900111222',
        onClick: () => {},
      })
    )

    // THEN: The nombre is visible as primary text
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
  })

  it('should render the nit prop as secondary text', async () => {
    // GIVEN: A ClientListItem with a specific NIT
    const { ClientListItem } = await import('../ClientListItem')

    // WHEN: The component is rendered
    render(
      React.createElement(ClientListItem, {
        id: '1',
        nombre: 'Empresa ABC',
        nit: '900111222',
        onClick: () => {},
      })
    )

    // THEN: The NIT is visible as secondary text
    expect(screen.getByText('900111222')).toBeInTheDocument()
  })

  it('should render with data-testid="cliente-list-item"', async () => {
    // GIVEN: A ClientListItem
    const { ClientListItem } = await import('../ClientListItem')

    // WHEN: Rendered
    render(
      React.createElement(ClientListItem, {
        id: '2',
        nombre: 'Test Co',
        nit: '123',
        onClick: () => {},
      })
    )

    // THEN: The testid is present for reliable selection
    expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ClientListItem — interaction
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — interaction', () => {
  it('should call onClick when the item is clicked', async () => {
    // GIVEN: A ClientListItem with an onClick handler
    const { ClientListItem } = await import('../ClientListItem')
    const handleClick = vi.fn()

    // WHEN: The user clicks the item
    render(
      React.createElement(ClientListItem, {
        id: '1',
        nombre: 'Empresa Click',
        nit: '900',
        onClick: handleClick,
      })
    )

    fireEvent.click(screen.getByTestId('cliente-list-item'))

    // THEN: onClick is called once
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should NOT call onClick when rendered in default (unselected) state without clicking', async () => {
    // GIVEN: A ClientListItem
    const { ClientListItem } = await import('../ClientListItem')
    const handleClick = vi.fn()

    // WHEN: It is rendered without any interaction
    render(
      React.createElement(ClientListItem, {
        id: '1',
        nombre: 'Empresa',
        nit: '900',
        onClick: handleClick,
      })
    )

    // THEN: onClick has not been called
    expect(handleClick).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ClientListItem — selected state
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — selected state', () => {
  it('should set aria-selected="true" when isSelected is true', async () => {
    // GIVEN: A ClientListItem with isSelected=true
    const { ClientListItem } = await import('../ClientListItem')

    // WHEN: Rendered as selected
    render(
      React.createElement(ClientListItem, {
        id: '1',
        nombre: 'Selected Corp',
        nit: '900',
        isSelected: true,
        onClick: () => {},
      })
    )

    // THEN: aria-selected is "true"
    const item = screen.getByTestId('cliente-list-item')
    expect(item).toHaveAttribute('aria-selected', 'true')
  })

  it('should set aria-selected="false" when isSelected is false', async () => {
    // GIVEN: A ClientListItem with isSelected=false
    const { ClientListItem } = await import('../ClientListItem')

    // WHEN: Rendered as unselected
    render(
      React.createElement(ClientListItem, {
        id: '1',
        nombre: 'Unselected Corp',
        nit: '900',
        isSelected: false,
        onClick: () => {},
      })
    )

    // THEN: aria-selected is "false"
    const item = screen.getByTestId('cliente-list-item')
    expect(item).toHaveAttribute('aria-selected', 'false')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ClientListItem — accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — accessibility', () => {
  it('should have role="listitem"', async () => {
    // GIVEN: A ClientListItem
    const { ClientListItem } = await import('../ClientListItem')

    // WHEN: Rendered
    render(
      React.createElement(ClientListItem, {
        id: '1',
        nombre: 'Empresa ARIA',
        nit: '900',
        onClick: () => {},
      })
    )

    // THEN: The element has role="listitem"
    expect(screen.getByRole('listitem')).toBeInTheDocument()
  })

  it('should have aria-label equal to the nombre prop', async () => {
    // GIVEN: A ClientListItem with nombre "Empresa ARIA"
    const { ClientListItem } = await import('../ClientListItem')

    // WHEN: Rendered
    render(
      React.createElement(ClientListItem, {
        id: '1',
        nombre: 'Empresa ARIA',
        nit: '900',
        onClick: () => {},
      })
    )

    // THEN: aria-label matches the nombre for screen reader context
    const item = screen.getByTestId('cliente-list-item')
    expect(item).toHaveAttribute('aria-label', 'Empresa ARIA')
  })
})
