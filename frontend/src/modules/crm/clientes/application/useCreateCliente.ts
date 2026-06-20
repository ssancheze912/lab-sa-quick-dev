import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'siesa-ui-kit'
import type { CreateClienteData } from '../domain/Cliente'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClienteData) => clienteApiRepository.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente creado correctamente')
    },
    onError: (error: unknown) => {
      const status = (error as AxiosError)?.response?.status
      if (status !== 409) {
        toast.error('No se pudo guardar. Intenta de nuevo.')
      }
    },
  })
}
