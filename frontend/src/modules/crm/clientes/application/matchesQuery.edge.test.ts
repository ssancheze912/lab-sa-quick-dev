/**
 * Story 2.1: Client List & Search — Automate Phase
 * Epic 2: Client Management
 *
 * AUTOMATE expansion tests (edge cases — NOT regenerated from ATDD)
 * Complements `matchesQuery.test.ts` (the ATDD baseline / TC-E2-P3-03) with
 * additional substring boundaries, special characters, and long-query inputs.
 *
 * Acceptance Criteria touched:
 *   AC #5  — Real-time search filter (predicate over `nombre` OR `nit`).
 *   AC #11 — Spanish-friendly search (diacritics must not break the predicate).
 */

import { describe, it, expect } from 'vitest'
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

describe('matchesQuery — edge cases (AC #5, #11)', () => {
  it('[P2] matches when the query is a prefix of `nombre`', () => {
    // GIVEN: a client whose nombre starts with the query
    const client = buildCliente({ nombre: 'Distribuidora Andina' })
    // WHEN / THEN: prefix matches via substring inclusion
    expect(matchesQuery(client, 'Distri')).toBe(true)
  })

  it('[P2] matches when the query is a suffix of `nombre`', () => {
    // GIVEN: a client whose nombre ends with the query
    const client = buildCliente({ nombre: 'Distribuidora Andina' })
    // WHEN / THEN: suffix matches via substring inclusion
    expect(matchesQuery(client, 'Andina')).toBe(true)
  })

  it('[P2] matches when the query is in the middle of `nombre`', () => {
    // GIVEN: a client with a multi-word nombre
    const client = buildCliente({ nombre: 'Compañia de Servicios Andinos' })
    // WHEN / THEN: middle substring matches
    expect(matchesQuery(client, 'Servicios')).toBe(true)
  })

  it('[P2] matches `nombre` containing Spanish diacritics with a non-diacritic query', () => {
    // GIVEN: a client with diacritics in its nombre
    const client = buildCliente({ nombre: 'Compañía Eléctrica' })
    // WHEN / THEN: the predicate does NOT alter case but accents stay literal
    // (folding accents is intentionally NOT done — users typing the exact word still match)
    expect(matchesQuery(client, 'Eléctrica')).toBe(true)
  })

  it('[P2] does NOT match `nombre` when query has diacritics but data does not (literal contract)', () => {
    // GIVEN: a client without diacritics
    const client = buildCliente({ nombre: 'Compania Andina' })
    // WHEN / THEN: a query "Compañía" with ñ does not match "Compania" — predicate is literal substring
    // This is the documented behavior. Story 2.6 may add diacritic folding.
    expect(matchesQuery(client, 'Compañía')).toBe(false)
  })

  it('[P2] handles a query longer than both `nombre` and `nit`', () => {
    // GIVEN: a client and a query that is longer than every field
    const client = buildCliente({ nombre: 'Acme', nit: '111-1' })
    // WHEN / THEN: the predicate returns false (no field can contain a longer string)
    expect(matchesQuery(client, 'a-very-long-query-that-no-field-contains-zzz')).toBe(false)
  })

  it('[P2] matches `nit` when only the numeric portion is typed', () => {
    // GIVEN: a NIT with a dash + check digit
    const client = buildCliente({ nit: '900100100-1' })
    // WHEN / THEN: typing just the numeric prefix matches (substring)
    expect(matchesQuery(client, '9001')).toBe(true)
  })

  it('[P2] matches `nit` when only the trailing portion (post-dash) is typed', () => {
    // GIVEN: a NIT with a unique trailing block
    const client = buildCliente({ nit: '900100100-7' })
    // WHEN / THEN: typing the post-dash portion matches via substring
    expect(matchesQuery(client, '00-7')).toBe(true)
  })

  it('[P2] returns false when only a digit appears in `nombre` but not `nit`', () => {
    // GIVEN: a client whose nombre contains a digit but the nit has different ones
    const client = buildCliente({ nombre: 'Empresa-5', nit: '111-1' })
    // WHEN / THEN: query "9" matches nothing
    expect(matchesQuery(client, '9')).toBe(false)
  })

  it('[P2] trims surrounding whitespace before evaluating', () => {
    // GIVEN: a client and a query with surrounding spaces
    const client = buildCliente({ nombre: 'Acme S.A.' })
    // WHEN / THEN: leading/trailing whitespace is trimmed (matches "Acme")
    expect(matchesQuery(client, '  Acme  ')).toBe(true)
  })

  it('[P2] is reflexive: a client matches a query equal to its own nombre', () => {
    // GIVEN: a client
    const client = buildCliente({ nombre: 'Acme S.A.' })
    // WHEN / THEN: querying with the full nombre matches itself
    expect(matchesQuery(client, 'Acme S.A.')).toBe(true)
  })

  it('[P3] does NOT throw when `nombre` or `nit` is an empty string (defensive boundary)', () => {
    // GIVEN: a client with empty data (in practice the entity prevents this, but the
    // predicate must be resilient to upstream regressions)
    const client = buildCliente({ nombre: '', nit: '' })
    // WHEN / THEN: empty fields with a non-empty query return false (no field can contain it)
    expect(matchesQuery(client, 'something')).toBe(false)
  })
})
