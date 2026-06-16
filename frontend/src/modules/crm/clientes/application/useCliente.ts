import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export const useCliente = (clienteId: string | undefined) =>
  useQuery({
    queryKey: ['clientes', clienteId],
    queryFn: () => clienteApiRepository.getById(clienteId!),
    enabled: !!clienteId,
    staleTime: 30_000,
    retry: 0,
  })
