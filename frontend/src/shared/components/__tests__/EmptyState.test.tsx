/**
 * Unit Tests — EmptyState shared component
 * Story 2.1: Client List & Search (edge-case expansion)
 *
 * Covers: rendering with message only, rendering with action button,
 * action callback invocation, WCAG aria-hidden on icon, boundary conditions
 * for empty/long message strings.
 *
 * Stack: Vitest + React Testing Library
 */

import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from '../EmptyState'

// ---------------------------------------------------------------------------
// Rendering — message-only variant (no action)
// ---------------------------------------------------------------------------

describe('EmptyState — message-only variant', () => {
  test('renders data-testid="empty-state" root element', () => {
    render(<EmptyState message="Sin datos" />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  test('displays the provided message text', () => {
    render(<EmptyState message="No hay clientes registrados." />)
    expect(screen.getByText('No hay clientes registrados.')).toBeInTheDocument()
  })

  test('does not render an action button when actionLabel is omitted', () => {
    render(<EmptyState message="Vacío" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('does not render an action button when only onAction is provided (without actionLabel)', () => {
    render(<EmptyState message="Vacío" onAction={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('icon has aria-hidden="true" for WCAG 2.1 AA compliance', () => {
    render(<EmptyState message="Sin datos" />)
    // The UserGroupIcon should carry aria-hidden so screen readers skip it
    const svgIcon = screen.getByTestId('empty-state').querySelector('svg')
    expect(svgIcon).not.toBeNull()
    expect(svgIcon).toHaveAttribute('aria-hidden', 'true')
  })

  test('renders a very long message without crashing', () => {
    const longMsg = 'A'.repeat(300)
    render(<EmptyState message={longMsg} />)
    expect(screen.getByText(longMsg)).toBeInTheDocument()
  })

  test('renders a message that is a single space character (edge: whitespace)', () => {
    render(<EmptyState message=" " />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Rendering — with action button
// ---------------------------------------------------------------------------

describe('EmptyState — action button variant', () => {
  test('renders the action button when both actionLabel and onAction are provided', () => {
    render(<EmptyState message="Vacío" actionLabel="Crear cliente" onAction={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Crear cliente' })).toBeInTheDocument()
  })

  test('invokes onAction callback when action button is clicked', async () => {
    const onAction = vi.fn()
    const user = userEvent.setup()
    render(<EmptyState message="Vacío" actionLabel="Crear" onAction={onAction} />)

    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(onAction).toHaveBeenCalledTimes(1)
  })

  test('onAction is called exactly once per click, not multiple times', async () => {
    const onAction = vi.fn()
    const user = userEvent.setup()
    render(<EmptyState message="Vacío" actionLabel="Crear" onAction={onAction} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('button'))

    expect(onAction).toHaveBeenCalledTimes(2)
  })

  test('does not render button when actionLabel is provided but onAction is omitted', () => {
    render(<EmptyState message="Vacío" actionLabel="Crear" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
