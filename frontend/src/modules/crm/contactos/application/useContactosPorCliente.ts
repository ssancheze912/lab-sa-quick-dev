import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../../shared/lib/apiClient'

export interface Contacto {
  id: string
  nombre: string
  clienteId: string | null
}

export function useContactosPorCliente(clienteId: string) {
  return useQuery<Contacto[]>({
    queryKey: ['contactos', { clienteId }],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Contacto[]>(`/api/v1/contactos?clienteId=${clienteId}`)
        return response.data
      } catch {
        // Contactos API may not be available yet (Epic 3). Return empty array gracefully.
        return []
      }
    },
    enabled: Boolean(clienteId),
    retry: false,
  })
}
