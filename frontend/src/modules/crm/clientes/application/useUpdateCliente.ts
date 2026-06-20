import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'siesa-ui-kit'
import type { UpdateClienteData } from '../domain/Cliente'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useUpdateCliente(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateClienteData) => clienteApiRepository.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
      void queryClient.invalidateQueries({ queryKey: ['clientes', id] })
      toast.success('Cliente actualizado correctamente')
    },
    onError: (error: unknown) => {
      const status = (error as AxiosError)?.response?.status
      if (status !== 409) {
        toast.error('No se pudo guardar. Intenta de nuevo.')
      }
    },
  })
}
