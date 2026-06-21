import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { ClienteFormData } from './clienteSchema';

export function useCreateCliente(setNitError?: (message: string) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClienteFormData) => clienteApiRepository.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente creado correctamente');
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError;
      if (axiosError?.response?.status === 409) {
        setNitError?.('El NIT/RUC ya está registrado');
      } else {
        toast.error('No se pudo crear el cliente. Intenta de nuevo.');
      }
    },
  });
}
