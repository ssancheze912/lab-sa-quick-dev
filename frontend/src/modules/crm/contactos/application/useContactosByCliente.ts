import { useQuery } from '@tanstack/react-query';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';

export const useContactosByCliente = (clienteId: string | undefined) =>
  useQuery({
    queryKey: ['contactos', { clienteId }],
    queryFn: () => contactoApiRepository.getByClienteId(clienteId!),
    enabled: !!clienteId,
    staleTime: 0,
  });
