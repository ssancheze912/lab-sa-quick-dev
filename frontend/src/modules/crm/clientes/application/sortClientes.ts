import type { Cliente } from '../domain/Cliente'

export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'

export function sortClientes(clientes: Cliente[], option: SortOption): Cliente[] {
  const sorted = [...clientes]
  switch (option) {
    case 'nombre-asc':
      return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    case 'nombre-desc':
      return sorted.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'))
    case 'fecha-desc':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    case 'fecha-asc':
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    default:
      return sorted
  }
}
