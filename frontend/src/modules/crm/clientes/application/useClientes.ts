import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { Cliente } from '../domain/Cliente'

export function useClientes() {
  return useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: clienteApiRepository.getAll,
    staleTime: 0,
  })
}

export function useClientesFiltrados(searchQuery: string) {
  const query = useClientes()

  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return query.data ?? []
    const q = searchQuery.toLowerCase()
    return (query.data ?? []).filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q),
    )
  }, [query.data, searchQuery])

  return {
    ...query,
    filteredClientes,
  }
}
