/**
 * Story 2.1 — Shared component smoke tests: `ErrorPanel`.
 *
 * ATDD RED-phase test. ErrorPanel lives at
 * `frontend/src/shared/components/ErrorPanel.tsx` and is used by
 * `ClienteListView` to render the "No se pudieron cargar los clientes"
 * panel with a "Reintentar" button wired to `query.refetch()` (AC #4).
 */

import { describe, expect, test, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ErrorPanel } from '@/shared/components/ErrorPanel'

afterEach(() => cleanup())

describe('ErrorPanel — Story 2.1', () => {
  test('GIVEN title + description + testId WHEN rendered THEN Spanish copy and a Reintentar button are present', () => {
    render(
      <ErrorPanel
        title="No se pudieron cargar los clientes"
        description="Intenta de nuevo en unos segundos."
        onRetry={() => {}}
        testId="clientes-error-panel"
      />,
    )

    const panel = screen.getByTestId('clientes-error-panel')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveTextContent('No se pudieron cargar los clientes')
    expect(panel).toHaveTextContent('Intenta de nuevo en unos segundos.')
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  test('GIVEN onRetry callback WHEN user clicks "Reintentar" THEN onRetry is invoked exactly once', () => {
    const onRetry = vi.fn()

    render(
      <ErrorPanel
        title="No se pudieron cargar los clientes"
        description="Intenta de nuevo en unos segundos."
        onRetry={onRetry}
        testId="clientes-error-panel"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
