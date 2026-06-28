import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { ClienteFormData } from './clienteSchema';
import type { Cliente } from '../domain/Cliente';

export const useUpdateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteFormData }) =>
      clienteApiRepository.update(id, data),
    onSuccess: (updatedCliente: Cliente) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes', updatedCliente.id] });
      toast.success('Cliente actualizado correctamente');
    },
  });
};
