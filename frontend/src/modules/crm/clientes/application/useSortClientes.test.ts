import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSortClientes } from './useSortClientes'
import type { Cliente } from '../domain/Cliente'

const makeCliente = (overrides: Partial<Cliente>): Cliente => ({
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Test',
  nit: '123456789-0',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const clientes: Cliente[] = [
  makeCliente({
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Zebra Corp',
    createdAt: '2026-01-03T00:00:00Z',
  }),
  makeCliente({
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Alpha SA',
    createdAt: '2026-01-01T00:00:00Z',
  }),
  makeCliente({
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'Media Ltda',
    createdAt: '2026-01-02T00:00:00Z',
  }),
]

describe('useSortClientes', () => {
  it('default sort is fecha-desc (newest first)', () => {
    // Arrange & Act
    const { result } = renderHook(() => useSortClientes(clientes))

    // Assert — sortOption defaults to fecha-desc
    expect(result.current.sortOption).toBe('fecha-desc')
    // First item should be newest (2026-01-03)
    expect(result.current.sortedClientes[0].nombre).toBe('Zebra Corp')
  })

  it('nombre-asc sort produces alphabetically ascending result', () => {
    // Arrange
    const { result } = renderHook(() => useSortClientes(clientes))

    // Act
    act(() => {
      result.current.setSortOption('nombre-asc')
    })

    // Assert
    const names = result.current.sortedClientes.map((c) => c.nombre)
    expect(names).toEqual(['Alpha SA', 'Media Ltda', 'Zebra Corp'])
  })

  it('nombre-desc sort produces alphabetically descending result', () => {
    // Arrange
    const { result } = renderHook(() => useSortClientes(clientes))

    // Act
    act(() => {
      result.current.setSortOption('nombre-desc')
    })

    // Assert
    const names = result.current.sortedClientes.map((c) => c.nombre)
    expect(names).toEqual(['Zebra Corp', 'Media Ltda', 'Alpha SA'])
  })

  it('fecha-asc sort produces chronologically ascending result (oldest first)', () => {
    // Arrange
    const { result } = renderHook(() => useSortClientes(clientes))

    // Act
    act(() => {
      result.current.setSortOption('fecha-asc')
    })

    // Assert — oldest first (2026-01-01)
    expect(result.current.sortedClientes[0].nombre).toBe('Alpha SA')
    expect(result.current.sortedClientes[2].nombre).toBe('Zebra Corp')
  })

  it('fecha-desc sort produces chronologically descending result (newest first)', () => {
    // Arrange
    const { result } = renderHook(() => useSortClientes(clientes))

    // sortOption is already fecha-desc by default, but set explicitly
    act(() => {
      result.current.setSortOption('fecha-desc')
    })

    // Assert — newest first (2026-01-03)
    expect(result.current.sortedClientes[0].nombre).toBe('Zebra Corp')
    expect(result.current.sortedClientes[2].nombre).toBe('Alpha SA')
  })

  it('sort is applied on top of filtered array without clearing filter', () => {
    // Arrange — simulate a pre-filtered array (only 2 items, as if search filter was applied)
    const filtered: Cliente[] = [
      makeCliente({
        id: '11111111-1111-1111-1111-111111111111',
        nombre: 'Zebra Corp',
        createdAt: '2026-01-03T00:00:00Z',
      }),
      makeCliente({
        id: '22222222-2222-2222-2222-222222222222',
        nombre: 'Alpha SA',
        createdAt: '2026-01-01T00:00:00Z',
      }),
    ]

    const { result } = renderHook(() => useSortClientes(filtered))

    // Act — change sort on filtered array
    act(() => {
      result.current.setSortOption('nombre-asc')
    })

    // Assert — only 2 items (filtered), sorted alphabetically
    expect(result.current.sortedClientes).toHaveLength(2)
    expect(result.current.sortedClientes[0].nombre).toBe('Alpha SA')
    expect(result.current.sortedClientes[1].nombre).toBe('Zebra Corp')
  })

  it('original array is not mutated by any sort operation', () => {
    // Arrange
    const original = [...clientes]
    const originalFirstName = original[0].nombre
    const { result } = renderHook(() => useSortClientes(clientes))

    // Act — apply all sort modes
    const sortOptions = ['nombre-asc', 'nombre-desc', 'fecha-asc', 'fecha-desc'] as const
    for (const option of sortOptions) {
      act(() => {
        result.current.setSortOption(option)
      })
    }

    // Assert — original array is untouched
    expect(clientes[0].nombre).toBe(originalFirstName)
    expect(clientes).toHaveLength(3)
  })

  it('returns all three expected properties', () => {
    // Arrange & Act
    const { result } = renderHook(() => useSortClientes(clientes))

    // Assert
    expect(result.current).toHaveProperty('sortedClientes')
    expect(result.current).toHaveProperty('sortOption')
    expect(result.current).toHaveProperty('setSortOption')
    expect(typeof result.current.setSortOption).toBe('function')
  })
})
