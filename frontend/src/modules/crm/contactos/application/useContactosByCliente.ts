import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContactosByCliente(clienteId: string | null | undefined) {
  return useQuery({
    queryKey: ['contactos', { clienteId }],
    queryFn: () => contactoApiRepository.getByClienteId(clienteId as string),
    enabled: !!clienteId,
    staleTime: 30_000,
    retry: 1,
  })
}
