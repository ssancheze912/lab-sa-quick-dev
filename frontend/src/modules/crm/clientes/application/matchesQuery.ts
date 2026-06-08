import type { Cliente } from '../domain/Cliente'

/**
 * Pure predicate used by the in-memory search filter (AC #5).
 *
 * - Trims whitespace + lowercases the query.
 * - Empty / whitespace-only query → returns `true` (no filter applied).
 * - Matches if EITHER `nombre` OR `nit` contains the query as a substring,
 *   case-insensitive.
 */
export function matchesQuery(client: Cliente, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    client.nombre.toLowerCase().includes(q) ||
    client.nit.toLowerCase().includes(q)
  )
}
