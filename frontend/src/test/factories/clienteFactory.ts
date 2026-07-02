import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

/**
 * Deterministic Cliente factory for tests. No faker dependency — keeps the
 * factory reproducible across runs and CI shards.
 */
export function makeCliente(overrides: Partial<Cliente> = {}): Cliente {
  const id = overrides.id ?? '00000000-0000-0000-0000-000000000000'
  const iso = '2026-06-01T10:00:00Z'
  return {
    id,
    nombre: 'Cliente Uno',
    nit: '900000000-1',
    telefono: '+57 300 000 0000',
    ciudad: 'Cali',
    createdAt: iso,
    updatedAt: iso,
    ...overrides,
  }
}

export function makeClientesBulk(n: number): Cliente[] {
  return Array.from({ length: n }, (_, i) => {
    const idx = String(i + 1).padStart(12, '0')
    return makeCliente({
      id: `11111111-1111-1111-1111-${idx}`,
      nombre: `Cliente ${i + 1}`,
      nit: `900${String(100000 + i).padStart(6, '0')}-1`,
      telefono: `+57 300 ${String(1000 + i).padStart(4, '0')} 0000`,
      ciudad: i % 3 === 0 ? 'Cali' : i % 3 === 1 ? 'Bogotá' : 'Medellín',
    })
  })
}
