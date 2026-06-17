import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { Cliente } from '../domain/Cliente';

export const useUpdateCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Cliente, 'id' | 'createdAt'> }) =>
      clienteApiRepository.update(id, data),
    onSuccess: () => {
      // MANDATORY: invalidate list so FR27 (immediate visibility) is satisfied
      // ['clientes', id] is automatically covered by hierarchical invalidation
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
};
