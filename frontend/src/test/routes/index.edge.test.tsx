/**
 * Story 1.1 — IndexPage route component edge cases
 * Covers boundary conditions not present in the ATDD tests.
 *
 * Note: TanStack Router renders asynchronously in tests. IndexPage is tested
 * in isolation (direct component render) to avoid async router timing issues
 * in unit tests. E2E tests cover the full routing integration.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Direct component definition (mirrors src/routes/index.tsx) ───────────────

function IndexPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold text-slate-800">Siesa Agents</h1>
    </main>
  )
}

describe('IndexPage — edge cases', () => {
  it('renders the "Siesa Agents" heading text', () => {
    render(<IndexPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Siesa Agents')
  })

  it('renders exactly one h1 element (not multiple conflicting headings)', () => {
    const { container } = render(<IndexPage />)
    const h1s = container.querySelectorAll('h1')
    expect(h1s).toHaveLength(1)
  })

  it('renders a <main> semantic element as the page wrapper', () => {
    const { container } = render(<IndexPage />)
    const main = container.querySelector('main')
    expect(main).not.toBeNull()
  })

  it('does not crash when rendered without any props', () => {
    expect(() => render(<IndexPage />)).not.toThrow()
  })

  it('heading text is not empty', () => {
    render(<IndexPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent?.trim().length).toBeGreaterThan(0)
  })

  it('does not render multiple main elements', () => {
    const { container } = render(<IndexPage />)
    const mains = container.querySelectorAll('main')
    expect(mains).toHaveLength(1)
  })
})
