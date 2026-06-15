/**
 * Story 2.1 — Shared component smoke tests: `EmptyState`.
 *
 * ATDD RED-phase test. EmptyState lives at
 * `frontend/src/shared/components/EmptyState.tsx` and is used by
 * `ClienteListView` to render the "Aún no hay clientes" and
 * "Sin resultados" panels (AC #3, AC #5).
 */

import { describe, expect, test, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { EmptyState } from '@/shared/components/EmptyState'

afterEach(() => cleanup())

describe('EmptyState — Story 2.1', () => {
  test('GIVEN title + description + testId WHEN rendered THEN Spanish copy appears and testId is exposed', () => {
    render(
      <EmptyState
        title="Aún no hay clientes"
        description="Crea el primer cliente para empezar a gestionar tu cartera."
        testId="clientes-empty-state"
      />,
    )

    const panel = screen.getByTestId('clientes-empty-state')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveTextContent('Aún no hay clientes')
    expect(panel).toHaveTextContent(
      'Crea el primer cliente para empezar a gestionar tu cartera.',
    )
  })

  test('GIVEN variant="search-empty" WHEN rendered THEN the search-empty panel is exposed via testId', () => {
    render(
      <EmptyState
        variant="search-empty"
        title="Sin resultados"
        description="No encontramos clientes con «acme»."
        testId="clientes-search-empty"
      />,
    )

    const panel = screen.getByTestId('clientes-search-empty')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveTextContent('Sin resultados')
    expect(panel).toHaveTextContent('No encontramos clientes con «acme».')
  })
})
