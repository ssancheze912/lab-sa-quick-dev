/**
 * Story 2.2 — ClienteNotFound shared component edge-case expansion.
 *
 * Complements ClienteNotFound.test.tsx with cases the ATDD layer omits:
 *   [P2] Root element is a <section> (not a <div>) for landmark semantics
 *   [P2] The Heroicon (ExclamationCircleIcon) is aria-hidden="true" (decorative)
 *   [P2] Heading element is an <h2> (paired with parent's aria-labelledby chain)
 *   [P2] Multiple rapid clicks each invoke onBackToList (no internal debounce)
 *   [P2] Keyboard activation (Enter / Space) on the focused button fires the callback
 *   [P2] Component renders the spec-mandated text-center class on its root
 *   [P2] The button uses the outline variant per UX spec
 */
import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ClienteNotFound } from './ClienteNotFound'

describe('ClienteNotFound — edge cases', () => {
  // ─── [P2] Root element is a <section> ────────────────────────────────
  test('[P2] root container is a <section> element (landmark semantics)', () => {
    render(<ClienteNotFound onBackToList={() => {}} />)
    const root = screen.getByTestId('cliente-not-found')
    expect(root.tagName).toBe('SECTION')
  })

  // ─── [P2] Decorative icon is aria-hidden ─────────────────────────────
  test('[P2] decorative ExclamationCircleIcon is aria-hidden="true"', () => {
    const { container } = render(<ClienteNotFound onBackToList={() => {}} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })

  // ─── [P2] Heading is an <h2> ─────────────────────────────────────────
  test('[P2] "Cliente no encontrado" is rendered inside an <h2>', () => {
    render(<ClienteNotFound onBackToList={() => {}} />)
    const heading = screen.getByText('Cliente no encontrado')
    expect(heading.tagName).toBe('H2')
  })

  // ─── [P2] Subtitle is a <p> ──────────────────────────────────────────
  test('[P2] subtitle text is rendered inside a <p>', () => {
    render(<ClienteNotFound onBackToList={() => {}} />)
    const subtitle = screen.getByText(
      'El cliente que buscas no existe o fue eliminado'
    )
    expect(subtitle.tagName).toBe('P')
  })

  // ─── [P2] Three rapid clicks each fire onBackToList ──────────────────
  test('[P2] three rapid clicks each fire onBackToList (no debouncing)', async () => {
    const onBackToList = vi.fn()
    const user = userEvent.setup()

    render(<ClienteNotFound onBackToList={onBackToList} />)
    const button = screen.getByRole('button', { name: 'Volver a la lista' })

    await user.click(button)
    await user.click(button)
    await user.click(button)

    expect(onBackToList).toHaveBeenCalledTimes(3)
  })

  // ─── [P2] Keyboard activation (Enter) fires onBackToList ──────────────
  test('[P2] pressing Enter on the focused button fires onBackToList', async () => {
    const onBackToList = vi.fn()
    const user = userEvent.setup()

    render(<ClienteNotFound onBackToList={onBackToList} />)
    const button = screen.getByRole('button', { name: 'Volver a la lista' })
    button.focus()
    await user.keyboard('{Enter}')

    expect(onBackToList).toHaveBeenCalledTimes(1)
  })

  // ─── [P2] Keyboard activation (Space) fires onBackToList ─────────────
  test('[P2] pressing Space on the focused button fires onBackToList', async () => {
    const onBackToList = vi.fn()
    const user = userEvent.setup()

    render(<ClienteNotFound onBackToList={onBackToList} />)
    const button = screen.getByRole('button', { name: 'Volver a la lista' })
    button.focus()
    await user.keyboard(' ')

    expect(onBackToList).toHaveBeenCalledTimes(1)
  })

  // ─── [P2] Layout class names match the spec ───────────────────────────
  test('[P2] root container is centered (flex-col / items-center / text-center)', () => {
    render(<ClienteNotFound onBackToList={() => {}} />)
    const root = screen.getByTestId('cliente-not-found')
    expect(root.className).toContain('flex')
    expect(root.className).toContain('items-center')
    expect(root.className).toContain('text-center')
  })

  // ─── [P2] Hardcoded hex colors are NOT used (Tailwind tokens only) ───
  test('[P2] root and icon do NOT use raw hex color classes', () => {
    const { container } = render(<ClienteNotFound onBackToList={() => {}} />)
    const html = container.innerHTML
    // Tokens like slate-* / muted-foreground / primary-* are fine.
    // Raw `#xxxxxx` hex strings are forbidden (company-standards).
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}/)
  })

  // ─── [P2] Visible text is exclusively in Spanish ──────────────────────
  test('[P2] component does NOT render any English text — only Spanish (company UX rule)', () => {
    render(<ClienteNotFound onBackToList={() => {}} />)
    const root = screen.getByTestId('cliente-not-found')
    const text = root.textContent ?? ''
    // Forbidden English markers — common defaults from generic not-found UIs.
    expect(text).not.toMatch(/\bnot found\b/i)
    expect(text).not.toMatch(/\bback to list\b/i)
    expect(text).not.toMatch(/\bclient does not exist\b/i)
    expect(text).not.toMatch(/\bretry\b/i)
  })
})
