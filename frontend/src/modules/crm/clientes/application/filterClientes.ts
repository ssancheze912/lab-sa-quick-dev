import type { Cliente } from '../domain/Cliente';

/**
 * Pure filter function for client-side search.
 * Matches against nombre or nit fields (case-insensitive).
 * An empty query returns the full list unchanged.
 */
export function filterClientes(clientes: Cliente[], query: string): Cliente[] {
  if (!query.trim()) return clientes;

  const lower = query.toLowerCase();
  return clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(lower) ||
      c.nit.toLowerCase().includes(lower),
  );
}
