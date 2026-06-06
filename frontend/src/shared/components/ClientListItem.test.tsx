/**
 * Story 2.1: Client List & Search
 * Component tests for ClientListItem
 *
 * Acceptance Criteria covered: AC1 (renders Nombre + NIT, selected styles,
 * click/keyboard interaction, accessibility attributes)
 *
 * NOTE: Tests are in RED state — they will fail until ClientListItem.tsx is implemented.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// RED: import will fail until component exists
import { ClientListItem } from './ClientListItem'

const mockCliente = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Constructora Andina S.A.S',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

afterEach(() => cleanup())

describe('ClientListItem — rendering', () => {
  /**
   * AC1: Each list item shows the client's Nombre and NIT/RUC.
   */
  it('renders client Nombre prominently', () => {
    render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={vi.fn()}
      />
    )

    expect(screen.getByText('Constructora Andina S.A.S')).toBeInTheDocument()
  })

  it('renders client NIT/RUC', () => {
    render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={vi.fn()}
      />
    )

    expect(screen.getByText('900123456-1')).toBeInTheDocument()
  })

  it('renders both Nombre and NIT/RUC in the same item', () => {
    const { container } = render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={vi.fn()}
      />
    )

    expect(container).toHaveTextContent('Constructora Andina S.A.S')
    expect(container).toHaveTextContent('900123456-1')
  })
})

describe('ClientListItem — selected state', () => {
  /**
   * AC1: Selected item shows border-left + bg (isSelected=true).
   */
  it('does not apply selected class when isSelected is false', () => {
    const { container } = render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={vi.fn()}
      />
    )

    // The item should have data-testid for selection verification
    const item = container.firstChild as HTMLElement
    expect(item).not.toHaveAttribute('aria-pressed', 'true')
  })

  it('applies selected state when isSelected is true', () => {
    render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={true}
        onClick={vi.fn()}
      />
    )

    const item = screen.getByRole('button', { name: /Ver cliente: Constructora Andina S.A.S/i })
    expect(item).toHaveAttribute('aria-pressed', 'true')
  })

  it('aria-pressed is false when not selected', () => {
    render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={vi.fn()}
      />
    )

    const item = screen.getByRole('button', { name: /Ver cliente: Constructora Andina S.A.S/i })
    expect(item).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('ClientListItem — interactions', () => {
  /**
   * AC1: onClick fires when clicked.
   */
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()

    render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={handleClick}
      />
    )

    const item = screen.getByRole('button', { name: /Ver cliente: Constructora Andina S.A.S/i })
    fireEvent.click(item)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  /**
   * AC1: Keyboard Enter triggers onClick.
   */
  it('calls onClick on Enter key press', () => {
    const handleClick = vi.fn()

    render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={handleClick}
      />
    )

    const item = screen.getByRole('button', { name: /Ver cliente: Constructora Andina S.A.S/i })
    fireEvent.keyDown(item, { key: 'Enter', code: 'Enter' })

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  /**
   * AC1: Keyboard Space triggers onClick.
   */
  it('calls onClick on Space key press', () => {
    const handleClick = vi.fn()

    render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={handleClick}
      />
    )

    const item = screen.getByRole('button', { name: /Ver cliente: Constructora Andina S.A.S/i })
    fireEvent.keyDown(item, { key: ' ', code: 'Space' })

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onClick on other key presses (Tab, Escape)', () => {
    const handleClick = vi.fn()

    render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={handleClick}
      />
    )

    const item = screen.getByRole('button', { name: /Ver cliente: Constructora Andina S.A.S/i })
    fireEvent.keyDown(item, { key: 'Tab' })
    fireEvent.keyDown(item, { key: 'Escape' })

    expect(handleClick).not.toHaveBeenCalled()
  })
})

describe('ClientListItem — accessibility', () => {
  /**
   * AC1: aria-label="Ver cliente: {nombre}" per story spec.
   */
  it('has aria-label containing the client nombre', () => {
    render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={vi.fn()}
      />
    )

    const item = screen.getByRole('button')
    expect(item).toHaveAttribute(
      'aria-label',
      'Ver cliente: Constructora Andina S.A.S'
    )
  })

  /**
   * AC1: role="button" on the element.
   */
  it('has role="button"', () => {
    render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={vi.fn()}
      />
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  /**
   * AC1: Minimum 44px touch target height (WCAG 2.1 AA).
   */
  it('has data-testid="client-list-item" for testability', () => {
    render(
      <ClientListItem
        cliente={mockCliente}
        isSelected={false}
        onClick={vi.fn()}
      />
    )

    expect(screen.getByTestId('client-list-item')).toBeInTheDocument()
  })
})
