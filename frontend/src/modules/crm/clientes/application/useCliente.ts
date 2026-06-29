import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useCliente(clienteId: string | null | undefined) {
  return useQuery({
    queryKey: ['clientes', clienteId],
    queryFn: () => clienteApiRepository.getById(clienteId!),
    enabled: !!clienteId,
    staleTime: 0,
    retry: 0,
  })
}
