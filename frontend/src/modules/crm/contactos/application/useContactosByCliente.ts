import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContactosByCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['contactos', { clienteId }],
    queryFn: () => contactoApiRepository.getByClienteId(clienteId!),
    enabled: !!clienteId,
  })
}
