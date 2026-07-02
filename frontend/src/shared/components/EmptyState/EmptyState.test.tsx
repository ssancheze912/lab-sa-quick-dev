import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the search-empty variant with title and subtitle', () => {
    render(
      <EmptyState
        variant="search-empty"
        title="No se encontró ningún cliente"
        subtitle="Intenta con otro nombre o NIT"
      />,
    )

    const root = screen.getByTestId('empty-state-search-empty')
    expect(root).toBeInTheDocument()
    expect(root).toHaveAttribute('role', 'status')
    expect(root).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText(/No se encontró ningún cliente/i)).toBeInTheDocument()
    expect(screen.getByText(/Intenta con otro nombre o NIT/i)).toBeInTheDocument()
  })

  it('renders the no-clients variant with a CTA that invokes onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <EmptyState
        variant="no-clients"
        title="No hay clientes registrados"
        subtitle="Crea el primer cliente del sistema"
        cta={{ label: 'Nuevo cliente', onClick }}
      />,
    )

    expect(screen.getByTestId('empty-state-no-clients')).toBeInTheDocument()
    const cta = screen.getByRole('button', { name: /nuevo cliente/i })
    expect(cta).toBeInTheDocument()

    await user.click(cta)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('accepts a custom icon override', () => {
    render(
      <EmptyState
        variant="no-contacts"
        title="Sin contactos"
        icon={<span data-testid="custom-icon">*</span>}
      />,
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────
  // Edge cases / expansions (Story 2.1 automate pass)
  // ───────────────────────────────────────────────────────────────────────

  it('[P1] renders WITHOUT a CTA button when the cta prop is omitted', () => {
    // GIVEN / WHEN: An EmptyState without a cta
    render(
      <EmptyState
        variant="search-empty"
        title="No se encontró ningún cliente"
        subtitle="Intenta con otro nombre o NIT"
      />,
    )

    // THEN: No button appears (search-empty variant is CTA-less per Story AC #3)
    expect(screen.queryByRole('button')).toBeNull()
    // AND: The container still renders correctly
    expect(screen.getByTestId('empty-state-search-empty')).toBeInTheDocument()
  })

  it('[P1] renders WITHOUT a subtitle paragraph when the prop is omitted', () => {
    // GIVEN / WHEN: An EmptyState without subtitle
    const { container } = render(
      <EmptyState variant="no-contacts" title="Sin contactos" />,
    )

    // THEN: The title exists but no descriptive <p> block below it
    expect(screen.getByText('Sin contactos')).toBeInTheDocument()
    // Zero <p> elements — the subtitle is the only <p> the component renders
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })

  it('[P2] renders the default icon per variant when no icon override is passed', () => {
    // GIVEN / WHEN: Three EmptyStates, one per variant, all without icon override
    const { rerender, container } = render(
      <EmptyState variant="search-empty" title="A" />,
    )
    // THEN: Every variant renders exactly one SVG (its default heroicon)
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(1)

    rerender(<EmptyState variant="no-clients" title="B" />)
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(1)

    rerender(<EmptyState variant="no-contacts" title="C" />)
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(1)
  })

  it('[P2] exposes role="status" plus aria-live="polite" on every variant (a11y)', () => {
    // GIVEN / WHEN / THEN: Each variant announces politely to assistive tech
    const variants = ['search-empty', 'no-clients', 'no-contacts'] as const
    for (const variant of variants) {
      const { unmount } = render(<EmptyState variant={variant} title="T" />)
      const root = screen.getByTestId(`empty-state-${variant}`)
      expect(root).toHaveAttribute('role', 'status')
      expect(root).toHaveAttribute('aria-live', 'polite')
      unmount()
    }
  })

  it('[P2] does not double-invoke onClick when the user clicks the CTA twice', async () => {
    // GIVEN: A CTA with a spy
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <EmptyState
        variant="no-clients"
        title="No hay clientes registrados"
        cta={{ label: 'Nuevo cliente', onClick }}
      />,
    )

    // WHEN: The user clicks twice
    const cta = screen.getByRole('button', { name: /nuevo cliente/i })
    await user.click(cta)
    await user.click(cta)

    // THEN: Two independent invocations — no debouncing swallows the second click
    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
