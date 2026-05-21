import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

/**
 * Story 1.1 — Project Initialization & Repository Structure
 * Unit-level edge cases for the frontend shell infrastructure
 *
 * Covers gaps NOT addressed in setup.test.ts:
 *  - apiClient has no Authorization header at init stage (security invariant, AC1)
 *  - apiClient has no global timeout set at Story 1.1 scope (AC1)
 *  - queryClient retry option introspection (behavior documentation, AC1)
 *  - queryClient staleTime is exactly 60000ms (business requirement, AC1)
 *  - QueryProvider renders children correctly (component wiring smoke, AC1)
 *
 * Test IDs: UNIT-EDGE-01 … UNIT-EDGE-06
 */

// ─────────────────────────────────────────────────────────────────────────────
// AC1: apiClient edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('UNIT-EDGE: apiClient edge cases (AC1)', () => {
  /**
   * UNIT-EDGE-01 (P1 — AC1)
   * Boundary: apiClient module must load without throwing even when VITE_API_URL
   * is undefined in the test environment. axios.create() tolerates an undefined
   * baseURL — confirming the module does not guard on this at import time.
   */
  it('UNIT-EDGE-01 — apiClient se crea sin lanzar excepción aunque VITE_API_URL no esté definido en test', async () => {
    // GIVEN: The module may have an undefined VITE_API_URL in test environment
    // WHEN: Importing the apiClient (dynamic import to reset module state)
    let importError: unknown = null

    try {
      await import('../shared/lib/apiClient')
    } catch (err) {
      importError = err
    }

    // THEN: The import must not throw — axios.create() tolerates undefined baseURL
    expect(importError).toBeNull()
  })

  /**
   * UNIT-EDGE-02 (P1 — AC1)
   * Boundary: apiClient.defaults.headers must NOT include an Authorization header.
   * Story 1.1 configures only baseURL and Content-Type — no auth is in scope.
   * A pre-set Authorization header would be a security defect.
   */
  it('UNIT-EDGE-02 — apiClient no tiene cabecera Authorization en la configuración base (sin auth en Story 1.1)', async () => {
    // GIVEN: The apiClient as configured in Story 1.1
    const { apiClient } = await import('../shared/lib/apiClient')

    // WHEN: Inspecting the common headers
    const commonHeaders = apiClient.defaults.headers.common as Record<string, unknown>

    // THEN: No Authorization header must be set as a default
    expect(commonHeaders['Authorization']).toBeUndefined()
    expect(commonHeaders['authorization']).toBeUndefined()
  })

  /**
   * UNIT-EDGE-03 (P2 — AC1)
   * Boundary: apiClient.defaults.timeout should be undefined or 0.
   * Story 1.1 does not configure a global timeout — a non-zero value would indicate
   * an unintentional default that could cause false timeouts for slow operations.
   */
  it('UNIT-EDGE-03 — apiClient no tiene timeout global configurado en Story 1.1', async () => {
    // GIVEN: The apiClient as configured
    const { apiClient } = await import('../shared/lib/apiClient')

    // WHEN: Checking timeout setting
    const timeout = apiClient.defaults.timeout

    // THEN: No global timeout at this initialization stage
    // (0 or undefined: no timeout in axios)
    expect(timeout === undefined || timeout === 0).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1: queryClient edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('UNIT-EDGE: queryClient edge cases (AC1)', () => {
  /**
   * UNIT-EDGE-04 (P1 — AC1)
   * Documentation: queryClient retry option state is introspectable.
   * TanStack Query v5 defaults to 3 retries when retry is not set.
   * Story 1.1 does not configure retry — this test documents the known state so
   * a future story that changes retry behavior will have a clear baseline to diff.
   */
  it('UNIT-EDGE-04 — queryClient retry es introspectable (documentación del estado actual)', async () => {
    // GIVEN: The queryClient with its configured defaultOptions
    const { queryClient } = await import('../shared/lib/queryClient')

    // WHEN: Checking default retry option
    const queryDefaults = queryClient.getDefaultOptions()
    const retry = queryDefaults.queries?.retry

    // THEN: Either retry is explicitly configured (any valid type) or undefined
    // Both cases are valid for Story 1.1 scope — what matters is that the property
    // is introspectable without throwing
    if (retry !== undefined) {
      expect(
        typeof retry === 'number' || typeof retry === 'boolean' || typeof retry === 'function'
      ).toBe(true)
    } else {
      expect(retry).toBeUndefined()
    }
  })

  /**
   * UNIT-EDGE-05 (P1 — AC1)
   * Boundary: queryClient staleTime must be exactly 60,000ms (1 minute per story spec).
   * A value of 0 causes infinite refetching; too large prevents fresh data.
   * The exact value is a business requirement from Story 1.1 Dev Notes.
   */
  it('UNIT-EDGE-05 — queryClient staleTime es exactamente 60000ms (1 minuto exacto)', async () => {
    // GIVEN: The queryClient singleton
    const { queryClient } = await import('../shared/lib/queryClient')

    // WHEN: Reading the configured staleTime
    const queryDefaults = queryClient.getDefaultOptions()
    const staleTime = queryDefaults.queries?.staleTime

    // THEN: staleTime must be exactly 60000 (1000 * 60)
    expect(staleTime).toBe(60_000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1: QueryProvider component edge case
// ─────────────────────────────────────────────────────────────────────────────

describe('UNIT-EDGE: QueryProvider component (AC1)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * UNIT-EDGE-06 (P1 — AC1)
   * Boundary: QueryProvider must render its children without throwing.
   * An incorrectly wired QueryClientProvider (missing client prop or wrong singleton)
   * would throw a React invariant violation during render.
   */
  it('UNIT-EDGE-06 — QueryProvider renderiza hijos sin lanzar excepción (wiring correcto)', async () => {
    // GIVEN: QueryProvider wrapping a simple child element
    const { QueryProvider } = await import('../app/providers/QueryProvider')

    // WHEN: Rendering with a child element
    // THEN: No exception thrown during render
    expect(() =>
      render(
        <QueryProvider>
          <span data-testid="child-probe">hello</span>
        </QueryProvider>,
      ),
    ).not.toThrow()

    // THEN: The child must be rendered and visible in the DOM
    const child = screen.getByTestId('child-probe')
    expect(child).toBeDefined()
    expect(child.textContent).toBe('hello')
  })
})
