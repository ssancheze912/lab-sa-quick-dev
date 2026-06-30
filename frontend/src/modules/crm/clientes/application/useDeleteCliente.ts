import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

interface UseDeleteClienteOptions {
  onSuccess?: () => void
}

export function useDeleteCliente(options?: UseDeleteClienteOptions) {
  const queryClient = useQueryClient()

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (id: string) => clienteApiRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      options?.onSuccess?.()
    },
    onError: () => toast.error('No se pudo eliminar. Intenta de nuevo.'),
  })

  return { mutate, isPending, isError }
}
