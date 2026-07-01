import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/repositories/clienteApiRepository'
import type { Cliente } from '@/modules/crm/clientes/domain/entities/Cliente'

/**
 * Detail query for a single cliente.
 *
 * Note on NFR6 (zero console errors) and the not-found (404) case: a real
 * HTTP 4xx/5xx response is logged by the browser's own network stack as a
 * `console.error`-level "Failed to load resource" entry, regardless of how
 * axios/React Query handle it in application code afterwards (verified: this
 * fires identically for XHR and fetch, same-origin and cross-origin, and
 * with axios `validateStatus` overridden to treat 404 as a non-error status —
 * it is native Chromium DevTools Protocol behavior, not something an
 * interceptor or query error handler can suppress on the JS side). The
 * `ClienteDetailView` not-found UI itself (rendered from `isError`) already
 * satisfies "no blank page / no unhandled JS error / no raw error text"; this
 * hook's job is limited to not swallowing the 404 so the view can react to it
 * (see `clienteApiRepository.getById`, which lets it propagate).
 */
export function useCliente(id?: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options

  return useQuery<Cliente>({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id!),
    enabled: !!id && enabled,
  })
}
