import type { Cliente } from '../domain/Cliente';

export function filterClientes(clientes: Cliente[], query: string): Cliente[] {
  if (!query.trim()) return clientes;
  const q = query.toLowerCase();
  return clientes.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  );
}
