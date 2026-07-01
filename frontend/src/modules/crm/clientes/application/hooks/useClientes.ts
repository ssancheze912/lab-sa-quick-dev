import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/repositories/clienteApiRepository'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
    staleTime: 60_000,
  })
}
