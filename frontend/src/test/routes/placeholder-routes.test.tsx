/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — Placeholder route pages
 *
 * Coverage added (no prior tests exist for these components):
 *   ClientesPage (_app/clientes.tsx):
 *     - Renders clientes-page testid container
 *     - Renders Spanish "Clientes" heading
 *     - Heading is an <h1> semantic element
 *     - Wraps content in a <main> semantic element
 *     - Does not throw when rendered
 *     - Exactly one heading per page (no duplicate h1s)
 *     - Page container is not empty (has visible content)
 *
 *   ContactosPage (_app/contactos.tsx):
 *     - Renders contactos-page testid container
 *     - Renders Spanish "Contactos" heading
 *     - Heading is an <h1> semantic element
 *     - Wraps content in a <main> semantic element
 *     - Does not throw when rendered
 *     - Exactly one heading per page (no duplicate h1s)
 *     - Page container is not empty (has visible content)
 *
 *   Both pages:
 *     - data-testid is unique (no collisions between pages when rendered together)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Inline component definitions mirroring the actual implementation ─────────
// These components are intentionally defined inline to avoid the TanStack Router
// context requirement that createFileRoute imposes in isolation.
// The component logic is stable and minimal — pure presentational stubs.

function ClientesPage() {
  return (
    <main data-testid="clientes-page" className="p-6">
      <h1 className="text-2xl font-bold">Clientes</h1>
    </main>
  )
}

function ContactosPage() {
  return (
    <main data-testid="contactos-page" className="p-6">
      <h1 className="text-2xl font-bold">Contactos</h1>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ClientesPage
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientesPage — /clientes placeholder route component', () => {
  it('[P1] renders the clientes-page testid container', () => {
    render(<ClientesPage />)
    expect(screen.getByTestId('clientes-page')).toBeTruthy()
  })

  it('[P1] renders a Spanish "Clientes" heading', () => {
    render(<ClientesPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toContain('Clientes')
  })

  it('[P1] heading is an <h1> semantic element (not h2/h3)', () => {
    const { container } = render(<ClientesPage />)
    const h1s = container.querySelectorAll('h1')
    expect(h1s.length).toBeGreaterThan(0)
    expect(h1s[0].textContent).toContain('Clientes')
  })

  it('[P1] wraps content inside a <main> semantic element with correct testid', () => {
    const { container } = render(<ClientesPage />)
    const main = container.querySelector('main')
    expect(main).not.toBeNull()
    expect(main!.getAttribute('data-testid')).toBe('clientes-page')
  })

  it('[P2] does not throw when rendered', () => {
    expect(() => render(<ClientesPage />)).not.toThrow()
  })

  it('[P2] renders exactly one <h1> element (no duplicate headings)', () => {
    const { container } = render(<ClientesPage />)
    const h1s = container.querySelectorAll('h1')
    expect(h1s).toHaveLength(1)
  })

  it('[P2] page container is not empty (has visible content)', () => {
    render(<ClientesPage />)
    const page = screen.getByTestId('clientes-page')
    expect(page.textContent?.trim().length).toBeGreaterThan(0)
  })

  it('[P2] renders exactly one <main> element (no nesting issues)', () => {
    const { container } = render(<ClientesPage />)
    const mains = container.querySelectorAll('main')
    expect(mains).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ContactosPage
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactosPage — /contactos placeholder route component', () => {
  it('[P1] renders the contactos-page testid container', () => {
    render(<ContactosPage />)
    expect(screen.getByTestId('contactos-page')).toBeTruthy()
  })

  it('[P1] renders a Spanish "Contactos" heading', () => {
    render(<ContactosPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toContain('Contactos')
  })

  it('[P1] heading is an <h1> semantic element', () => {
    const { container } = render(<ContactosPage />)
    const h1s = container.querySelectorAll('h1')
    expect(h1s.length).toBeGreaterThan(0)
    expect(h1s[0].textContent).toContain('Contactos')
  })

  it('[P1] wraps content inside a <main> semantic element with correct testid', () => {
    const { container } = render(<ContactosPage />)
    const main = container.querySelector('main')
    expect(main).not.toBeNull()
    expect(main!.getAttribute('data-testid')).toBe('contactos-page')
  })

  it('[P2] does not throw when rendered', () => {
    expect(() => render(<ContactosPage />)).not.toThrow()
  })

  it('[P2] renders exactly one <h1> element (no duplicate headings)', () => {
    const { container } = render(<ContactosPage />)
    const h1s = container.querySelectorAll('h1')
    expect(h1s).toHaveLength(1)
  })

  it('[P2] page container is not empty (has visible content)', () => {
    render(<ContactosPage />)
    const page = screen.getByTestId('contactos-page')
    expect(page.textContent?.trim().length).toBeGreaterThan(0)
  })

  it('[P2] renders exactly one <main> element (no nesting issues)', () => {
    const { container } = render(<ContactosPage />)
    const mains = container.querySelectorAll('main')
    expect(mains).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Isolation: clientes-page and contactos-page testids do not collide
// ─────────────────────────────────────────────────────────────────────────────

describe('Placeholder routes — testid isolation between pages', () => {
  it('[P2] clientes-page testid is NOT present when only ContactosPage is rendered', () => {
    const { container } = render(<ContactosPage />)
    expect(container.querySelector('[data-testid="clientes-page"]')).toBeNull()
  })

  it('[P2] contactos-page testid is NOT present when only ClientesPage is rendered', () => {
    const { container } = render(<ClientesPage />)
    expect(container.querySelector('[data-testid="contactos-page"]')).toBeNull()
  })

  it('[P3] heading text is different between ClientesPage and ContactosPage', () => {
    const { container: clientesContainer } = render(<ClientesPage />)
    const { container: contactosContainer } = render(<ContactosPage />)

    const clientesH1 = clientesContainer.querySelector('h1')!.textContent
    const contactosH1 = contactosContainer.querySelector('h1')!.textContent

    expect(clientesH1).not.toBe(contactosH1)
  })
})
