import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { CreateClienteRequest } from '../domain/Cliente'

interface UseCreateClienteOptions {
  onSuccess?: () => void
}

export function useCreateCliente(options?: UseCreateClienteOptions) {
  const queryClient = useQueryClient()

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (data: CreateClienteRequest) => clienteApiRepository.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente creado correctamente')
      options?.onSuccess?.()
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error('El NIT/RUC ya está registrado')
      } else {
        toast.error('No se pudo guardar. Intenta de nuevo.')
      }
    },
  })

  return { mutate, isPending, isError }
}
