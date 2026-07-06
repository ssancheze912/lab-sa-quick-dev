import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/clienteApiRepository'
import type { CreateClienteInput } from '@/modules/crm/clientes/domain/Cliente'

export function useUpdateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateClienteInput }) =>
      clienteApiRepository.update(id, data),
    onSuccess: (_updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes', variables.id] })
      toast.success('Cliente actualizado correctamente')
    },
  })
}
