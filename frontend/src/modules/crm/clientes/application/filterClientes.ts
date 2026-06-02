import type { Cliente } from '../domain/Cliente'
import { normalizeText } from './normalizeText'

/**
 * Pure dual-search filter for the cliente list (Story 2.1, AC-2.1.b).
 *
 *   - Case-insensitive AND diacritic-insensitive
 *   - Matches on `nombre` OR `nit`
 *   - Trims input; whitespace-only or empty query returns the full input
 *
 * Designed as a pure function so the perf test (TC-E2-P0-06) can wrap it in
 * `useMemo` for keystroke-cheap re-renders @ 500 records.
 */
export function filterClientes(clientes: Cliente[], query: string): Cliente[] {
  const trimmed = query.trim()
  if (trimmed === '') return clientes

  const needle = normalizeText(trimmed)
  return clientes.filter((c) => {
    const haystack = `${normalizeText(c.nombre)} ${normalizeText(c.nit)}`
    return haystack.includes(needle)
  })
}
