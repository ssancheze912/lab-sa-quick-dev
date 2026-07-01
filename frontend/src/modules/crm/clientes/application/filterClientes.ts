import type { Cliente } from '../domain/Cliente'

/**
 * Pure client-side filter for the Cliente list — Story 2.1 AC #2.
 *
 * Case- and diacritic-insensitive substring match against `nombre` OR `nit`.
 * Extracted as a pure function so it can be unit-tested in isolation and so
 * the perf benchmark in AC #9 can measure filter+render without harness noise.
 */
export function filterClientes(clientes: readonly Cliente[], query: string): Cliente[] {
  const q = query.trim()
  if (q.length === 0) return [...clientes]

  const normalized = normalize(q)
  return clientes.filter(
    (c) => normalize(c.nombre).includes(normalized) || normalize(c.nit).includes(normalized),
  )
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
