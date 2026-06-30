import { useQuery } from '@tanstack/react-query'

export interface Contacto {
  id: string
  nombre: string
  clienteId: string | null
}

export function useContactosPorCliente(clienteId: string) {
  return useQuery<Contacto[]>({
    queryKey: ['contactos', { clienteId }],
    queryFn: async () => [],
    enabled: Boolean(clienteId),
  })
}
