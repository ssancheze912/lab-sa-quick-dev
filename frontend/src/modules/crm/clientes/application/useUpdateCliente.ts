import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '../../../../shared/lib/toastStore'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { ClienteFormValues } from './clienteSchema'

export function useUpdateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteFormValues }) =>
      clienteApiRepository.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente actualizado correctamente')
    },
    onError: () => toast.error('No se pudo guardar. Intenta de nuevo.'),
  })
}
