import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/clienteApiRepository'

export function useCliente(clienteId: string) {
  return useQuery({
    queryKey: ['clientes', clienteId],
    queryFn: () => clienteApiRepository.getById(clienteId),
    enabled: !!clienteId,
  })
}
