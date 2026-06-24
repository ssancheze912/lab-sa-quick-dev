import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'siesa-ui-kit'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { ClienteFormValues } from './clienteSchema'

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClienteFormValues) => clienteApiRepository.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente creado correctamente')
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 409) {
        toast.error('El NIT/RUC ya está registrado')
      } else {
        toast.error('No se pudo guardar. Intenta de nuevo.')
      }
    },
  })
}
