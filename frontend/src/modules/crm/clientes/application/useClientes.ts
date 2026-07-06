import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/clienteApiRepository'

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
  })
}
