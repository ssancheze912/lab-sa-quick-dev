import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

interface UseDeleteClienteOptions {
  onSuccess?: () => void
  hasAssociatedContacts?: boolean
}

export function useDeleteCliente(options?: UseDeleteClienteOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => clienteApiRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      options?.onSuccess?.()
    },
  })
}
