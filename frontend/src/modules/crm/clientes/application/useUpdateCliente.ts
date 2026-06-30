import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { UpdateClienteRequest } from '../domain/Cliente'

interface UseUpdateClienteOptions {
  onSuccess?: () => void
}

export function useUpdateCliente(options?: UseUpdateClienteOptions) {
  const queryClient = useQueryClient()

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (data: UpdateClienteRequest) =>
      clienteApiRepository.update(data.id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes', variables.id] })
      toast.success('Cliente actualizado correctamente')
      options?.onSuccess?.()
    },
    onError: () => toast.error('No se pudo guardar. Intenta de nuevo.'),
  })

  return { mutate, isPending, isError }
}
