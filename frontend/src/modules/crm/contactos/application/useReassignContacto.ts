import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '../../../../shared/lib/toastStore'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

/**
 * Mutation hook to reassign a contacto to a different cliente.
 *
 * Reuses the `PUT /api/v1/contactos/{id}/cliente` endpoint already established
 * in Story 4.2 (via `contactoApiRepository.assignCliente`). On success, three
 * query keys are invalidated to keep both the old and the new cliente's
 * ContactManager (Story 4.1) in sync without page reload (FR27, Risk R1/R5):
 *
 *   - `['contactos']`                                — global list
 *   - `['contactos', { clienteId: oldClienteId }]`   — old cliente's panel
 *   - `['contactos', { clienteId: newClienteId }]`   — new cliente's panel
 *   - `['contactos', contactoId]`                    — contact detail
 *
 * @param contactoId       The contacto being reassigned.
 * @param oldClienteId     The previous clienteId (may be null — invalidation skipped).
 */
export function useReassignContacto(contactoId: string, oldClienteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newClienteId: string) =>
      contactoApiRepository.assignCliente(contactoId, newClienteId),
    onSuccess: (_data, newClienteId) => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      if (oldClienteId) {
        queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: oldClienteId }] })
      }
      queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: newClienteId }] })
      queryClient.invalidateQueries({ queryKey: ['contactos', contactoId] })
      toast.success('Contacto reasignado correctamente')
    },
    onError: () => {
      toast.error('No se pudo reasignar el contacto. Intenta de nuevo.')
    },
  })
}
