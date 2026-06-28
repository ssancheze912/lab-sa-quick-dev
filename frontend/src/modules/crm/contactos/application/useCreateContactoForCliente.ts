import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';
import type { ContactoFormData } from './contactoSchema';

interface CreateContactoForClienteData extends ContactoFormData {
  clienteId: string;
}

export function useCreateContactoForCliente(clienteId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactoForClienteData) =>
      contactoApiRepository.create({ ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      if (clienteId) {
        queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId }] });
      }
    },
  });
}
