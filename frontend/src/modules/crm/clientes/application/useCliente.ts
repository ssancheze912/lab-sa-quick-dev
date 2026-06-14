import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { Cliente } from '../domain/Cliente'

export function useCliente(id: string | null) {
  return useQuery<Cliente | null>({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id!),
    staleTime: 1000 * 60,
    enabled: !!id,
  })
}
