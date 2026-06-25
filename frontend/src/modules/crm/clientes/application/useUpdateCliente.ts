import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { UpdateClienteData } from './clienteSchema';

export function useUpdateCliente(clienteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateClienteData) => clienteApiRepository.update(clienteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes', clienteId] });
    },
  });
}
