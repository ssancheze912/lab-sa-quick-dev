import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export interface DeleteClienteResult {
  hadContacts: boolean;
}

export const useDeleteCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clienteApiRepository.delete(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.removeQueries({ queryKey: ['clientes', id] });
      // Toast is handled at component level (wording depends on hadContacts flag)
    },
  });
};
