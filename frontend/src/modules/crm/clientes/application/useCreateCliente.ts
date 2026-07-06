import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/clienteApiRepository'
import type { CreateClienteInput } from '@/modules/crm/clientes/domain/Cliente'

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClienteInput) => clienteApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente creado correctamente')
    },
  })
}
