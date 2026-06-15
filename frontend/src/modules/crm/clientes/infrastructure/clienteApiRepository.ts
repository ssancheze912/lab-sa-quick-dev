import axios from 'axios'
import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

/**
 * HTTP-backed implementation of {@link IClienteRepository} using the shared
 * Axios singleton (`apiClient`).
 *
 * `getById` translates a 404 response to `null` so the presentation layer can
 * distinguish a legitimate "cliente does not exist" (render the not-found
 * view) from a transport / 5xx error (render the ErrorPanel with Reintentar).
 *
 * `create` propagates axios errors verbatim — the consuming hook + form's
 * `onError` handler branch on `err.response?.status` to surface 409 inline
 * (duplicate NIT) or 400 (validator) or a red toast (5xx / network).
 */
export const clienteApiRepository: IClienteRepository = {
  getAll: () =>
    apiClient.get<Cliente[]>('/api/v1/clientes').then((r) => r.data),

  getById: async (id) => {
    try {
      const r = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
      return r.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null
      }
      throw err
    }
  },

  create: async (input) => {
    const r = await apiClient.post<Cliente>('/api/v1/clientes', input)
    return r.data
  },

  /**
   * PUT /api/v1/clientes/{id}. Story 2.4.
   *
   * Propagates axios errors verbatim — the consuming hook + form's `onError`
   * handler branch on `err.response?.status` to surface 409 inline (duplicate
   * NIT) / 400 (FluentValidation field errors) / 404 (closed-modal red toast,
   * unique to the update path) / 5xx + network (red toast, modal stays open).
   */
  update: async (id, input) => {
    const r = await apiClient.put<Cliente>(`/api/v1/clientes/${id}`, input)
    return r.data
  },
}
