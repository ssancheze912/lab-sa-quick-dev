import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '@/modules/crm/contactos/infrastructure/repositories/contactoApiRepository'
import type { Contacto } from '@/modules/crm/contactos/domain/entities/Contacto'

/**
 * Detail query for a single contacto. Mirrors `useCliente`'s exact pattern
 * (Story 2.2) — see that hook's doc comment for why a 404 is left to
 * propagate rather than swallowed (NFR6 / zero console errors is handled via
 * the `listMembership` prop on `ContactoDetailView`, not here).
 */
export function useContacto(id?: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options

  return useQuery<Contacto>({
    queryKey: ['contactos', id],
    queryFn: () => contactoApiRepository.getById(id!),
    enabled: !!id && enabled,
  })
}
