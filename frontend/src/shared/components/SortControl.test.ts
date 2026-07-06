/**
 * Story 2.6: Sort Client List — Automation Expansion (testarch-automate)
 * Epic 2: Client Management
 *
 * `sortClientes` is a pure function (no DOM, no network) exported alongside the presentational
 * `SortControl` component. The ATDD suite (`ClienteListView.sort.test.tsx`) only exercises it
 * indirectly through the rendered component with 3-item, distinctly-named/dated fixtures — per
 * `test-levels-framework.md`, pure algorithmic logic and its boundary conditions belong at the
 * Unit level, not re-verified through a full component render. This file closes that gap with
 * direct, fast, dependency-free tests of `sortClientes` itself.
 *
 * Covers boundary conditions NOT exercised by the ATDD suite:
 *  - Empty array input
 *  - Single-item array (no-op reorder)
 *  - Immutability: input array/object references are never mutated
 *  - Stability: equal `nombre` / equal `createdAt` values preserve original relative order
 *  - Case-insensitivity of `localeCompare`-based name sorting
 */

import { describe, test, expect } from 'vitest'
import { sortClientes, type SortOption } from './SortControl'

interface Fixture {
  id: string
  nombre: string
  createdAt: string
}

function item(id: string, nombre: string, createdAt: string): Fixture {
  return { id, nombre, createdAt }
}

describe('sortClientes — empty and single-item boundaries', () => {
  test('[P2] returns an empty array when given an empty array, for every sort option', () => {
    const options: SortOption[] = ['nombre-asc', 'nombre-desc', 'fecha-asc', 'fecha-desc']
    options.forEach((option) => {
      expect(sortClientes([], option)).toEqual([])
    })
  })

  test('[P2] returns a single-item array unchanged regardless of sort option', () => {
    const solo = item('1', 'Único Cliente', '2024-05-01T00:00:00.000Z')
    const options: SortOption[] = ['nombre-asc', 'nombre-desc', 'fecha-asc', 'fecha-desc']
    options.forEach((option) => {
      expect(sortClientes([solo], option)).toEqual([solo])
    })
  })
})

describe('sortClientes — immutability (never mutates its input)', () => {
  test('[P1] does not mutate the original input array', () => {
    const beta = item('1', 'Beta', '2024-01-01T00:00:00.000Z')
    const alfa = item('2', 'Alfa', '2024-06-01T00:00:00.000Z')
    const original = [beta, alfa]
    const originalCopy = [...original]

    sortClientes(original, 'nombre-asc')

    expect(original).toEqual(originalCopy)
    expect(original[0]).toBe(beta)
    expect(original[1]).toBe(alfa)
  })

  test('[P2] returns a new array instance, not the same reference as the input', () => {
    const original = [item('1', 'Beta', '2024-01-01T00:00:00.000Z')]
    const result = sortClientes(original, 'fecha-desc')
    expect(result).not.toBe(original)
  })
})

describe('sortClientes — stability (equal keys preserve original relative order)', () => {
  test('[P2] preserves original relative order for items with identical nombre (nombre-asc)', () => {
    const first = item('1', 'Duplicado', '2024-01-01T00:00:00.000Z')
    const second = item('2', 'Duplicado', '2024-02-01T00:00:00.000Z')
    const third = item('3', 'Duplicado', '2024-03-01T00:00:00.000Z')

    const result = sortClientes([first, second, third], 'nombre-asc')

    expect(result.map((c) => c.id)).toEqual(['1', '2', '3'])
  })

  test('[P2] preserves original relative order for items with identical createdAt (fecha-desc)', () => {
    const sameDate = '2024-06-15T12:00:00.000Z'
    const first = item('1', 'Alfa', sameDate)
    const second = item('2', 'Beta', sameDate)
    const third = item('3', 'Charlie', sameDate)

    const result = sortClientes([first, second, third], 'fecha-desc')

    expect(result.map((c) => c.id)).toEqual(['1', '2', '3'])
  })
})

describe('sortClientes — case-insensitive name comparison', () => {
  test('[P2] "nombre-asc" orders mixed-case names alphabetically, ignoring case', () => {
    const lower = item('1', 'apple corp', '2024-01-01T00:00:00.000Z')
    const upper = item('2', 'Banana SAS', '2024-01-01T00:00:00.000Z')
    const mixed = item('3', 'cherry Ltd', '2024-01-01T00:00:00.000Z')

    const result = sortClientes([upper, mixed, lower], 'nombre-asc')

    expect(result.map((c) => c.nombre)).toEqual(['apple corp', 'Banana SAS', 'cherry Ltd'])
  })

  test('[P3] "nombre-desc" is the exact reverse of "nombre-asc" for the same input', () => {
    const items = [
      item('1', 'apple corp', '2024-01-01T00:00:00.000Z'),
      item('2', 'Banana SAS', '2024-01-01T00:00:00.000Z'),
      item('3', 'cherry Ltd', '2024-01-01T00:00:00.000Z'),
    ]

    const asc = sortClientes(items, 'nombre-asc').map((c) => c.id)
    const desc = sortClientes(items, 'nombre-desc').map((c) => c.id)

    expect(desc).toEqual([...asc].reverse())
  })
})

describe('sortClientes — date boundary values', () => {
  test('[P3] treats createdAt values differing only by milliseconds as distinct and orders them correctly', () => {
    const earlier = item('1', 'Alfa', '2024-06-15T12:00:00.000Z')
    const later = item('2', 'Beta', '2024-06-15T12:00:00.001Z')

    const result = sortClientes([earlier, later], 'fecha-desc')

    expect(result.map((c) => c.id)).toEqual(['2', '1'])
  })
})
