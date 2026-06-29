import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { contactoApiRepository } from '../../contactos/infrastructure/contactoApiRepository'

interface AsociarContactoVariables {
  contactoId: string
  clienteId: string
}

export function useAsociarContacto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contactoId, clienteId }: AsociarContactoVariables) =>
      contactoApiRepository.assignCliente(contactoId, clienteId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: variables.clienteId }] })
      toast.success('Contacto asociado correctamente')
    },
    onError: () => {
      toast.error('No se pudo asociar el contacto. Intenta de nuevo.')
    },
  })
}
