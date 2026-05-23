import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '../../../../shared/lib/toastStore'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => clienteApiRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
    onError: () => toast.error('No se pudo eliminar. Intenta de nuevo.'),
  })
}
