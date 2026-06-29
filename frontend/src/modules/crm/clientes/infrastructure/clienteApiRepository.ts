import axios from 'axios'

import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'
import { ClienteNotFoundError } from '../domain/errors'

/**
 * Axios-backed implementation of {@link IClienteRepository}. Story 2.1 only
 * uses the parameterless GET; the optional `search` argument is exposed so
 * the contract is forward-compatible with future server-side filtering.
 *
 * Story 2.2 adds `getById` which maps a 404 to {@link ClienteNotFoundError}.
 * The Problem Details body is NOT propagated upward (NFR6).
 */
export const clienteApiRepository: IClienteRepository = {
  async getAll(search?: string): Promise<Cliente[]> {
    const response = await apiClient.get<Cliente[]>('/api/v1/clientes', {
      params: search ? { search } : undefined,
    })
    return response.data
  },
  async getById(id: string): Promise<Cliente> {
    try {
      const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
      return response.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        throw new ClienteNotFoundError(id)
      }
      throw err
    }
  },
}
