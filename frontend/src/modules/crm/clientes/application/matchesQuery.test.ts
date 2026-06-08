/**
 * Story 2.1: Client List & Search — TC-E2-P3-03
 * Epic 2: Client Management
 *
 * ATDD unit test — RED Phase
 * Intentionally FAILING until `matchesQuery(client, query)` is implemented.
 *
 * Acceptance Criteria covered:
 *   AC #5  — Real-time search filter (predicate over `nombre` OR `nit`).
 *   AC #11 — Spanish copy / no leakage of English fallback strings.
 *   AC #12 — TC-E2-P3-03 (Unit — Filter Predicate Combines `nombre` + `nit`).
 *
 * The predicate MUST be:
 *   - case-insensitive,
 *   - substring (NOT prefix-only),
 *   - apply to BOTH `nombre` AND `nit`,
 *   - treat empty / whitespace-only queries as "match everything" (so the input
 *     does not collapse to an empty list when the user clears it).
 */

import { describe, it, expect } from 'vitest'
// RED: matchesQuery.ts does not exist yet — this import will fail until Task 10 is done.
import { matchesQuery } from './matchesQuery'
import type { Cliente } from '../domain/Cliente'

function buildCliente(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Acme S.A.',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00+00:00',
    updatedAt: '2026-01-01T00:00:00+00:00',
    ...overrides,
  }
}

describe('matchesQuery — TC-E2-P3-03 (AC #5)', () => {
  it('returns true when the query is empty', () => {
    // GIVEN: an empty query
    // WHEN: matchesQuery is invoked
    // THEN: every client matches (no filter applied)
    expect(matchesQuery(buildCliente(), '')).toBe(true)
  })

  it('returns true when the query is whitespace-only', () => {
    // GIVEN: a whitespace-only query
    // WHEN: matchesQuery is invoked
    // THEN: every client matches (whitespace is trimmed before evaluation)
    expect(matchesQuery(buildCliente(), '   ')).toBe(true)
  })

  it('returns true when the query is a substring of `nombre` (case-insensitive)', () => {
    // GIVEN: a client with nombre "Acme S.A."
    const client = buildCliente({ nombre: 'Acme S.A.' })
    // WHEN: the query "acme" is checked (lowercase)
    // THEN: the predicate returns true
    expect(matchesQuery(client, 'acme')).toBe(true)
  })

  it('returns true when the query is a substring of `nombre` in mixed case', () => {
    // GIVEN: a client with nombre "Distribuidora Andina"
    const client = buildCliente({ nombre: 'Distribuidora Andina' })
    // WHEN: the query "ANDINA" is checked (uppercase)
    // THEN: the predicate is case-insensitive
    expect(matchesQuery(client, 'ANDINA')).toBe(true)
  })

  it('returns true when the query matches a substring of `nit` (case-insensitive)', () => {
    // GIVEN: a client with nit "900123456-1"
    const client = buildCliente({ nit: '900123456-1' })
    // WHEN: the query "9001" is checked
    // THEN: the predicate returns true (substring match over NIT)
    expect(matchesQuery(client, '9001')).toBe(true)
  })

  it('returns true when the query matches `nit` regardless of case', () => {
    // GIVEN: a client with nit containing alphanumeric characters
    const client = buildCliente({ nit: 'RUC900XYZ-1' })
    // WHEN: the query "xyz" is checked (lowercase)
    // THEN: the predicate is case-insensitive on NIT too
    expect(matchesQuery(client, 'xyz')).toBe(true)
  })

  it('returns false when the query matches neither `nombre` nor `nit`', () => {
    // GIVEN: a client with no "zzz" in either field
    const client = buildCliente({ nombre: 'Acme', nit: '111-1' })
    // WHEN: the query "zzz" is checked
    // THEN: the predicate returns false
    expect(matchesQuery(client, 'zzz')).toBe(false)
  })
})
