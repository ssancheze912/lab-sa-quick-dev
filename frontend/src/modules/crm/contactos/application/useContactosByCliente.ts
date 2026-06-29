import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContactosByCliente(clienteId: string | null | undefined) {
  return useQuery({
    queryKey: ['contactos', { clienteId }],
    queryFn: () => contactoApiRepository.getByClienteId(clienteId!),
    enabled: !!clienteId,
    staleTime: 0,
    retry: 0,
  })
}
