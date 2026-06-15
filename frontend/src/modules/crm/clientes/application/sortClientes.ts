import type { Cliente } from '../domain/Cliente'

/**
 * Sort options exposed to the UI via the `SortControl` dropdown.
 *
 *   - `fecha-desc` (default): newest first by `createdAt`.
 *   - `fecha-asc`: oldest first by `createdAt`.
 *   - `nombre-asc`: A → Z by `nombre` (Spanish locale, accent-aware).
 *   - `nombre-desc`: Z → A by `nombre`.
 */
export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'

export const DEFAULT_SORT: SortOption = 'fecha-desc'

const compareNombre = (a: Cliente, b: Cliente) =>
  a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })

// ISO 8601 strings sort chronologically when compared lexicographically as long
// as all timestamps share the same offset. Backend always serializes UTC.
const compareCreatedAt = (a: Cliente, b: Cliente) =>
  a.createdAt.localeCompare(b.createdAt)

/**
 * Pure, non-mutating sort. Returns a NEW array; never mutates the input.
 *
 * Tie-break rules (deterministic stability):
 *   - For name-primary sorts, tie-break is `createdAt` ASC.
 *   - For date-primary sorts, tie-break is `nombre` ASC.
 *
 * The primary direction is reversed via negation; the tie-break direction is
 * intentionally independent of the primary so identical-primary groups always
 * order the same way regardless of the chosen primary direction.
 */
export function sortClientes(
  clientes: readonly Cliente[],
  option: SortOption,
): Cliente[] {
  const copy = [...clientes]
  switch (option) {
    case 'nombre-asc':
      return copy.sort((a, b) => compareNombre(a, b) || compareCreatedAt(a, b))
    case 'nombre-desc':
      return copy.sort((a, b) => -compareNombre(a, b) || compareCreatedAt(a, b))
    case 'fecha-desc':
      return copy.sort((a, b) => -compareCreatedAt(a, b) || compareNombre(a, b))
    case 'fecha-asc':
      return copy.sort((a, b) => compareCreatedAt(a, b) || compareNombre(a, b))
  }
}
