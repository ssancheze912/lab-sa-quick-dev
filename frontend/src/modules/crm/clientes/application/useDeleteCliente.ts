import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/clienteApiRepository'

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => clienteApiRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente eliminado correctamente')
    },
  })
}
