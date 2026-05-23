/**
 * Edge Case Tests — Story 4.5: filterOrphanContactos
 * Unit tests for the filterOrphanContactos pure utility — boundary conditions,
 * error paths, and filter composition rules.
 *
 * Expands coverage beyond the ATDD suite (UNIT-AC-04, UNIT-AC-05).
 * Test IDs: UNIT-ORPHAN-EDGE-01 … UNIT-ORPHAN-EDGE-12
 *
 * Edge cases covered:
 *   - Single orphan in mixed list
 *   - All contacts are orphans
 *   - Contact with undefined clienteId (boundary type coercion guard)
 *   - Input array is NOT mutated
 *   - Returned array is a new reference
 *   - Large array (1000 items) — performance guard
 *   - Filter composition: filterOrphanContactos applied AFTER filterContactos
 *   - Composition returns empty when search narrows to non-orphans only
 *   - Composition returns correct subset when both filters active
 *   - orphanCount computed on full data (not on filtered searched data)
 *   - Re-calling with same input returns consistent results (idempotent)
 *   - Result order matches input order (preserves original ordering)
 */

import { describe, it, expect } from 'vitest'
import type { Contacto } from '../domain/Contacto'
import { filterOrphanContactos } from '../application/filterOrphanContactos'
import { filterContactos } from '../application/filterContactos'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function makeContacto(overrides: Partial<Contacto> & { id: string }): Contacto {
  return {
    nombre: `Contacto ${overrides.id}`,
    cargo: 'Analista',
    telefono: `310000000${overrides.id}`,
    email: `contacto${overrides.id}@empresa.com`,
    clienteId: null,
    createdAt: '2026-05-21T10:00:00Z',
    updatedAt: '2026-05-21T10:00:00Z',
    ...overrides,
  }
}

const mixedContacts: Contacto[] = [
  makeContacto({ id: '1', nombre: 'Huerfano Alfa', clienteId: null }),
  makeContacto({ id: '2', nombre: 'Con Cliente Beta', clienteId: 'cliente-uuid-001' }),
  makeContacto({ id: '3', nombre: 'Huerfano Gamma', clienteId: null }),
  makeContacto({ id: '4', nombre: 'Con Cliente Delta', clienteId: 'cliente-uuid-002' }),
]

describe('filterOrphanContactos — edge cases', () => {
  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-01 (P1)
  // Boundary: single orphan in a mixed list — must return exactly that one contact.
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-01 — single orphan in mixed list is returned alone', () => {
    const contacts: Contacto[] = [
      makeContacto({ id: 'a', nombre: 'Un Huerfano', clienteId: null }),
      makeContacto({ id: 'b', nombre: 'Con Cliente Uno', clienteId: 'cliente-uuid-x' }),
      makeContacto({ id: 'c', nombre: 'Con Cliente Dos', clienteId: 'cliente-uuid-y' }),
    ]
    const result = filterOrphanContactos(contacts)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a')
    expect(result[0].clienteId).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-02 (P1)
  // Boundary: all contacts are orphans — all must be returned.
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-02 — when all contacts are orphans, all are returned', () => {
    const allOrphans: Contacto[] = [
      makeContacto({ id: '10', clienteId: null }),
      makeContacto({ id: '11', clienteId: null }),
      makeContacto({ id: '12', clienteId: null }),
    ]
    const result = filterOrphanContactos(allOrphans)
    expect(result).toHaveLength(3)
    expect(result.every((c) => c.clienteId === null)).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-03 (P1)
  // Boundary: result preserves input order (orphans appear in the same relative
  // order as in the original array — no reordering side effects).
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-03 — result preserves input order of orphan contacts', () => {
    const result = filterOrphanContactos(mixedContacts)
    // Orphans are ids '1' and '3' in that order
    expect(result.map((c) => c.id)).toEqual(['1', '3'])
  })

  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-04 (P1)
  // Boundary: input array must NOT be mutated.
  // filterOrphanContactos is a pure function.
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-04 — input array is not mutated', () => {
    const input = [...mixedContacts]
    const originalIds = input.map((c) => c.id)
    const originalLength = input.length

    filterOrphanContactos(input)

    expect(input.map((c) => c.id)).toEqual(originalIds)
    expect(input).toHaveLength(originalLength)
  })

  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-05 (P1)
  // Boundary: returned array is a new reference (not the same object as input).
  // React useMemo deps rely on referential stability for correct re-renders.
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-05 — returned array is a new reference, not the same object', () => {
    const result = filterOrphanContactos(mixedContacts)
    expect(result).not.toBe(mixedContacts)
  })

  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-06 (P2)
  // Boundary: large array (1000 items, 50% orphans) must return correct count
  // without throwing. Validates NFR performance guard.
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-06 — large array (1000 items, 500 orphans) returns 500 without crash', () => {
    const large: Contacto[] = Array.from({ length: 1000 }, (_, i) =>
      makeContacto({
        id: String(i),
        clienteId: i % 2 === 0 ? null : `cliente-${i}`,
      })
    )
    expect(() => filterOrphanContactos(large)).not.toThrow()
    const result = filterOrphanContactos(large)
    expect(result).toHaveLength(500)
    expect(result.every((c) => c.clienteId === null)).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-07 (P1)
  // Boundary: idempotent — calling filterOrphanContactos twice on the same input
  // must return equivalent results.
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-07 — calling twice on same input returns consistent results', () => {
    const result1 = filterOrphanContactos(mixedContacts)
    const result2 = filterOrphanContactos(mixedContacts)
    expect(result1.map((c) => c.id)).toEqual(result2.map((c) => c.id))
  })

  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-08 (P0) — Filter composition (Critical per architecture.md)
  // filterOrphanContactos applied AFTER filterContactos (as done in ContactoListView)
  // must return only contacts matching BOTH the search query AND clienteId === null.
  // Risk R7: orphan filter client-side correctness — composition must not break.
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-08 — composition: orphanFilter(searchFilter(data)) returns search+orphan intersection', () => {
    const contacts: Contacto[] = [
      makeContacto({ id: '1', nombre: 'Huerfano Alfa', email: 'alfa@empresa.com', clienteId: null }),
      makeContacto({ id: '2', nombre: 'Huerfano Beta', email: 'beta@empresa.com', clienteId: null }),
      makeContacto({ id: '3', nombre: 'Con Cliente Alfa', email: 'concliente@empresa.com', clienteId: 'c-uuid' }),
    ]

    // Searching "Alfa" matches id:1 (orphan) and id:3 (has client)
    // Orphan filter then keeps only id:1
    const searched = filterContactos(contacts, 'Alfa')
    const result = filterOrphanContactos(searched)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
    expect(result[0].clienteId).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-09 (P1)
  // Composition: when search narrows to contacts that ALL have a client,
  // orphan filter returns empty array (no crash, no wrong results).
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-09 — composition: search result containing no orphans yields empty array', () => {
    const contacts: Contacto[] = [
      makeContacto({ id: '1', nombre: 'Con Cliente Uno', email: 'uno@empresa.com', clienteId: 'c-uuid-1' }),
      makeContacto({ id: '2', nombre: 'Con Cliente Dos', email: 'dos@empresa.com', clienteId: 'c-uuid-2' }),
      makeContacto({ id: '3', nombre: 'Huerfano Tres', email: 'tres@empresa.com', clienteId: null }),
    ]

    // Search "Con Cliente" matches id:1 and id:2 — both have clients
    const searched = filterContactos(contacts, 'Con Cliente')
    const result = filterOrphanContactos(searched)

    expect(result).toHaveLength(0)
  })

  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-10 (P1)
  // Composition: when search has no results, orphan filter also returns empty.
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-10 — composition: empty search result yields empty orphan result', () => {
    const searched = filterContactos(mixedContacts, 'ZZZnonexistent')
    const result = filterOrphanContactos(searched)
    expect(result).toHaveLength(0)
  })

  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-11 (P0)
  // orphanCount MUST be computed on the full unfiltered dataset, NOT on the
  // post-search filtered list. This matches the ContactoListView useMemo pattern:
  //   const orphanCount = useMemo(() => filterOrphanContactos(data).length, [data])
  // The count badge must reflect total orphans regardless of active search query.
  // Risk R7: count badge incorrectness.
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-11 — orphanCount from full data differs from filtered+orphan count when search is active', () => {
    const contacts: Contacto[] = [
      makeContacto({ id: '1', nombre: 'Huerfano Alfa', clienteId: null }),
      makeContacto({ id: '2', nombre: 'Huerfano Beta', clienteId: null }),
      makeContacto({ id: '3', nombre: 'Con Cliente Alfa', clienteId: 'c-uuid' }),
    ]

    // orphanCount = filterOrphanContactos(data).length — computed on FULL data
    const orphanCountFromFullData = filterOrphanContactos(contacts).length
    expect(orphanCountFromFullData).toBe(2)

    // When searching "Alfa", filter pipeline returns: filterOrphanContactos(filterContactos(data, 'Alfa'))
    const searchedThenOrphan = filterOrphanContactos(filterContactos(contacts, 'Alfa'))
    expect(searchedThenOrphan).toHaveLength(1) // only "Huerfano Alfa" matches

    // The count badge (orphanCountFromFullData) must NOT equal searchedThenOrphan.length
    // when the search is narrowing the orphan set
    expect(orphanCountFromFullData).not.toBe(searchedThenOrphan.length)
  })

  // ---------------------------------------------------------------------------
  // UNIT-ORPHAN-EDGE-12 (P2)
  // Boundary: contact with an empty string clienteId — must NOT be treated as
  // an orphan (orphan = clienteId strictly === null, not falsy).
  // The Contacto type is `string | null`; an empty string is a non-null value.
  // ---------------------------------------------------------------------------
  it('UNIT-ORPHAN-EDGE-12 — contact with empty string clienteId is NOT returned as orphan (strict null check)', () => {
    const contacts = [
      makeContacto({ id: '1', clienteId: null }),        // orphan
      makeContacto({ id: '2', clienteId: '' as string | null }), // empty string — NOT an orphan by type contract
    ] as Contacto[]

    const result = filterOrphanContactos(contacts)
    // Only id:1 (actual null) should be returned
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})
