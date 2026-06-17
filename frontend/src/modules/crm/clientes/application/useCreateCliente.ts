import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { ClienteFormValues } from './clienteSchema';

export const useCreateCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClienteFormValues) => clienteApiRepository.create(data),
    onSuccess: () => {
      // MANDATORY: invalidate list cache so list refreshes automatically (FR27)
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
};
