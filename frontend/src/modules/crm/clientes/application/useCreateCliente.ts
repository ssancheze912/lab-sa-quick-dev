import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '../../../../shared/lib/toastStore'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { ClienteFormValues } from './clienteSchema'

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClienteFormValues) => clienteApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente creado correctamente')
    },
  })
}
