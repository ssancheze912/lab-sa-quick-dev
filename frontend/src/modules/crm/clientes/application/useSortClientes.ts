import { useState, useMemo } from 'react'
import type { Cliente } from '../domain/Cliente'
import type { SortOption } from '../../../../shared/components/SortControl'

export function useSortClientes(clientes: Cliente[]) {
  const [sortOption, setSortOption] = useState<SortOption>('fecha-desc')

  const sortedClientes = useMemo(() => {
    const copy = [...clientes]
    switch (sortOption) {
      case 'nombre-asc':
        return copy.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      case 'nombre-desc':
        return copy.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'))
      case 'fecha-desc':
        return copy.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      case 'fecha-asc':
        return copy.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
    }
  }, [clientes, sortOption])

  return { sortedClientes, sortOption, setSortOption }
}
