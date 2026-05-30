import type { Cliente } from '../domain/Cliente'

function normalize(str: string): string {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function filterClientes(clientes: Cliente[], query: string): Cliente[] {
  if (!query.trim()) return clientes
  const q = normalize(query)
  return clientes.filter(
    (c) => normalize(c.nombre).includes(q) || normalize(c.nit).includes(q),
  )
}
