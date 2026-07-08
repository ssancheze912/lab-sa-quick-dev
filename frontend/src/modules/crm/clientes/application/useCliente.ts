import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import type { Cliente } from '../domain/Cliente'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

/**
 * Canonical single-cliente query key (Story 2.2).
 * Story 2.4 (edit) and 2.5 (delete) MUST invalidate this exact tuple when
 * their mutations settle on the same id.
 */
export const clienteQueryKey = (id: string) => ['clientes', id] as const

/**
 * General 8-4-4-4-12 hex UUID format — matches every string .NET's `Guid`
 * accepts (v1-v8, nil, max, and any 128-bit hex-formatted identifier). We do
 * NOT use `z.uuid()` here because Zod v4's strict RFC 4122 variant/version
 * check rejects legitimate identifiers like `Guid.Empty` (nil) and non-4122
 * test fixtures, while our backend's `:guid` route constraint is equally
 * permissive. Keeping the frontend guard aligned with the backend prevents
 * false-negative `ClienteNotFound` renders on valid ids.
 */
const UUID_HEX_SCHEMA = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

/**
 * Guard used by both the hook and the presentation layer — a well-formed
 * UUID is required before the query is enabled. Non-UUID ids short-circuit
 * into the `ClienteNotFound` branch without hitting the backend (AC #4).
 */
export function isValidClienteId(id: string | undefined | null): id is string {
  return typeof id === 'string' && UUID_HEX_SCHEMA.safeParse(id).success
}

/**
 * Fetches a single Cliente by id (Story 2.2).
 * - `enabled` is false when `id` is not a well-formed UUID (AC #4).
 * - Retries are disabled — the not-found (AC #3) and error (AC #6) branches
 *   must surface after the first failed response so the UX matches the spec:
 *     * 404 → ClienteNotFound with a "Volver a la lista" CTA.
 *     * 5xx / network → ErrorPanel with a manual "Reintentar" button.
 *   Explicit user retry (refetch) is the intended recovery path per AC #6.
 * - `staleTime: 30_000` keeps the detail cached across route mounts within
 *   a session.
 */
export function useCliente(id: string | undefined) {
  const enabled = isValidClienteId(id)
  return useQuery<Cliente, Error>({
    queryKey: enabled ? clienteQueryKey(id) : ['clientes', 'invalid'],
    queryFn: ({ signal }) => clienteApiRepository.getById(id as string, signal),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}
