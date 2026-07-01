/**
 * Additional edge-case unit tests for filterClientes — Story 2.1 AC #2.
 *
 * Expands the ATDD suite with boundary, security-adjacent and
 * defensive-programming cases from test-design-epic-2 §4.3:
 *   - P2-41: case-insensitive on BOTH nombre AND nit (explicit combinatorial)
 *   - P2-43: special / XSS-like characters in query do not break filter
 *   - P2-44: 500-record list still returns correct subset (correctness only,
 *     perf is asserted separately in ClienteListView.perf.test.tsx)
 *   - Whitespace-trim: leading/trailing whitespace ignored
 *   - Long query: 1000-char query returns empty gracefully (no crash)
 *
 * Level: Unit (Vitest, pure function).
 * Given-When-Then structure.
 */
import { describe, it, expect } from 'vitest'
import { filterClientes } from './filterClientes'
import type { Cliente } from '../domain/Cliente'

const iso = '2025-01-01T00:00:00.000Z'

const build = (over: Partial<Cliente>): Cliente => ({
  id: over.id ?? 'id-x',
  nombre: over.nombre ?? 'Cliente X',
  nit: over.nit ?? '900000000',
  telefono: over.telefono ?? '3000000000',
  ciudad: over.ciudad ?? 'Bogotá',
  createdAt: over.createdAt ?? iso,
  updatedAt: over.updatedAt ?? iso,
})

const dataset: Cliente[] = [
  build({ id: 'a', nombre: 'Acme Corporation', nit: '900123456' }),
  build({ id: 'b', nombre: 'Peña & Asociados', nit: '800987654' }),
  build({ id: 'c', nombre: 'Global Foods S.A.', nit: '901555444' }),
]

describe('filterClientes — Story 2.1 AC #2 (edge cases)', () => {
  it('[P2] given a query with leading/trailing whitespace, when filtering, then whitespace is trimmed before matching', () => {
    // GIVEN
    // WHEN
    const result = filterClientes(dataset, '   acme   ')
    // THEN
    expect(result.map((c) => c.id)).toEqual(['a'])
  })

  it('[P2] given a case-mixed query targeting NIT, when filtering, then the match is case-insensitive across nit field', () => {
    // GIVEN — a NIT with letters (e.g. Colombian RUC formats can include letters)
    const withAlphaNit: Cliente[] = [
      build({ id: 'x', nombre: 'AlphaNit SA', nit: 'RUC-900XYZ' }),
      build({ id: 'y', nombre: 'BetaNit SA', nit: 'RUC-800ABC' }),
    ]
    // WHEN
    const result = filterClientes(withAlphaNit, 'ruc-800')
    // THEN
    expect(result.map((c) => c.id)).toEqual(['y'])
  })

  it('[P2] given a query containing special/regex-like characters, when filtering, then it treats them as literal substrings (no regex crash)', () => {
    // GIVEN — per test-design §4.3 P2-43 (XSS + special char resilience)
    const withSpecials: Cliente[] = [
      ...dataset,
      build({ id: 'd', nombre: 'Foo & Bar (LLC)', nit: '999999999' }),
    ]
    const specialQueries = ['(LLC)', '&', '.*', '[abc]', '<script>', '?query']
    // WHEN + THEN — no exception, and only matching literal substrings return hits
    for (const q of specialQueries) {
      const result = filterClientes(withSpecials, q)
      expect(Array.isArray(result)).toBe(true)
      // For queries that don't literally appear anywhere, result must be []
      if (q === '.*' || q === '[abc]' || q === '<script>' || q === '?query') {
        expect(result).toEqual([])
      }
    }
    // Sanity: literal ampersand DOES match the "Foo & Bar" record
    const ampResult = filterClientes(withSpecials, '&')
    expect(ampResult.map((c) => c.id)).toEqual(['b', 'd'])
  })

  it('[P2] given an extremely long query (>1000 chars) with no match, when filtering, then it returns [] and does not throw', () => {
    // GIVEN — boundary/defensive case
    const longQuery = 'z'.repeat(1500)
    // WHEN
    const result = filterClientes(dataset, longQuery)
    // THEN
    expect(result).toEqual([])
  })

  it('[P2] given a 500-record dataset, when filtering by a substring that hits 5 records, then it returns exactly those 5', () => {
    // GIVEN — per test-design §4.3 P2-44 (500-record NFR10 boundary — correctness only)
    const large: Cliente[] = Array.from({ length: 500 }, (_, i) => {
      const marker = i % 100 === 0 ? 'FLAG' : 'Regular' // seeds 5 records with FLAG
      return build({
        id: `id-${i}`,
        nombre: `${marker} Cliente ${i}`,
        nit: `900${String(100000 + i).slice(-6)}`,
      })
    })
    // WHEN
    const result = filterClientes(large, 'FLAG')
    // THEN
    expect(result).toHaveLength(5)
    expect(result.every((c) => c.nombre.includes('FLAG'))).toBe(true)
  })

  it('[P2] given both nombre AND nit contain the same substring, when filtering, then the client appears only once (no duplicates)', () => {
    // GIVEN — a cliente whose nit substring also appears in the nombre
    const overlap: Cliente[] = [
      build({ id: 'z', nombre: 'Empresa 900123', nit: '900123456' }),
    ]
    // WHEN
    const result = filterClientes(overlap, '900123')
    // THEN — matched by both fields but present only once in output
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('z')
  })
})
