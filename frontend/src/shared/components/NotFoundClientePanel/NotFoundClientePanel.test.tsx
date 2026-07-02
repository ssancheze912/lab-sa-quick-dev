import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotFoundClientePanel } from './NotFoundClientePanel'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  )
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('NotFoundClientePanel', () => {
  it('renders role="alert" with title, subtitle and CTA', () => {
    render(<NotFoundClientePanel />)

    const panel = screen.getByTestId('cliente-not-found')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveAttribute('role', 'alert')
    expect(panel).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('heading', { name: /cliente no encontrado/i })).toBeInTheDocument()
    expect(screen.getByText(/el cliente que buscas no existe o fue eliminado/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /volver a clientes/i })).toBeInTheDocument()
  })

  it('invokes navigate({ to: "/clientes" }) when the CTA is clicked', async () => {
    navigateMock.mockClear()
    const user = userEvent.setup()

    render(<NotFoundClientePanel />)

    await user.click(screen.getByRole('button', { name: /volver a clientes/i }))

    expect(navigateMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/clientes' })
  })

  it('honours the onBack prop and does NOT call navigate when it is provided', async () => {
    navigateMock.mockClear()
    const onBack = vi.fn()
    const user = userEvent.setup()

    render(<NotFoundClientePanel onBack={onBack} />)

    await user.click(screen.getByRole('button', { name: /volver a clientes/i }))

    expect(onBack).toHaveBeenCalledTimes(1)
    expect(navigateMock).not.toHaveBeenCalled()
  })

  // ───────────────────────────────────────────────────────────────────────
  // Edge cases / expansions (Story 2.2 automate pass)
  // ───────────────────────────────────────────────────────────────────────

  it('[P2] uses the custom testId when the prop is provided (default is "cliente-not-found")', () => {
    // GIVEN / WHEN: The component is rendered with a custom testId
    render(<NotFoundClientePanel testId="cliente-not-found-custom" />)

    // THEN: The panel is discoverable under the custom id and NOT under the default
    expect(screen.getByTestId('cliente-not-found-custom')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-not-found')).toBeNull()
  })

  it('[P2] exposes aria-live="polite" so screen readers announce the not-found state', () => {
    // GIVEN / WHEN: The default panel is rendered
    render(<NotFoundClientePanel />)

    // THEN: role + aria-live combine to announce the state politely (WCAG 2.1 AA)
    const panel = screen.getByTestId('cliente-not-found')
    expect(panel).toHaveAttribute('role', 'alert')
    expect(panel).toHaveAttribute('aria-live', 'polite')
  })

  it('[P2] the CTA button has an accessible name in Spanish ("Volver a Clientes")', () => {
    // GIVEN / WHEN: The default panel is rendered
    render(<NotFoundClientePanel />)

    // THEN: The button's accessible name is the exact Spanish label (es-CO contract)
    const cta = screen.getByRole('button', { name: /^volver a clientes$/i })
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveTextContent(/^Volver a Clientes$/)
  })

  it('[P2] does NOT invoke onBack when clicking outside the CTA button (no delegated handlers)', async () => {
    // GIVEN: onBack is provided and the panel is rendered
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(<NotFoundClientePanel onBack={onBack} />)

    // WHEN: The user clicks on the heading text (not the button)
    await user.click(screen.getByRole('heading', { name: /cliente no encontrado/i }))

    // THEN: onBack is not invoked — no click delegation from the container
    expect(onBack).not.toHaveBeenCalled()
  })
})
