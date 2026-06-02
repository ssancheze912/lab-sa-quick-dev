/**
 * Deterministic data factory for Cliente fixtures (Story 2.1).
 *
 * NOTE: This file is currently a TEST-ONLY stub. The actual `Cliente`
 * interface ships in `src/modules/crm/clientes/domain/Cliente.ts` once
 * DEV implements AC-2.1.g. The shape declared here mirrors that contract
 * so the failing ATDD tests can import it today.
 *
 * Used by:
 *   - ClienteListView.perf.test.tsx (TC-E2-P0-06) — requires deterministic
 *     500-record dataset for p95 < 200ms keystroke assertion.
 *   - ClienteListView.test.tsx — happy-path 3-fixture rendering.
 *   - filterClientes.test.ts — dual-search unit coverage.
 *
 * Why a hand-rolled LCG instead of faker?
 *   The DEV story explicitly forbids adding @faker-js/faker for one helper
 *   (see story Task 8). Mulberry32 gives us a deterministic PRNG in ~10 lines.
 */

import type { Cliente } from '../../domain/Cliente'

/** Mulberry32 — deterministic PRNG seeded by an integer. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SAMPLE_FIRST = [
  'Acme',
  'Beta',
  'Cementos',
  'Distribuidora',
  'Empresa',
  'Fabrica',
  'Grupo',
  'Holding',
  'Industrias',
  'JoseLuis',
]
const SAMPLE_LAST = ['Andina', 'Bolivar', 'Colombia', 'del Caribe', 'Pacifico', 'S.A.', 'Ltda.']
const CIUDADES = ['Bogota', 'Medellin', 'Cali', 'Barranquilla', 'Cartagena']

/**
 * Build `count` deterministic Cliente fixtures from `seed`.
 * Same (count, seed) ALWAYS produces the same array.
 */
export function makeClientes(count: number, seed: number): Cliente[] {
  const rand = mulberry32(seed)
  const now = new Date('2026-06-01T12:00:00.000Z').getTime()
  const out: Cliente[] = []
  for (let i = 0; i < count; i++) {
    const first = SAMPLE_FIRST[Math.floor(rand() * SAMPLE_FIRST.length)]
    const last = SAMPLE_LAST[Math.floor(rand() * SAMPLE_LAST.length)]
    const ciudad = CIUDADES[Math.floor(rand() * CIUDADES.length)]
    const nitNumber = Math.floor(rand() * 900_000_000) + 100_000_000
    const nitDv = Math.floor(rand() * 10)
    const phoneArea = Math.floor(rand() * 9) + 1
    const phoneRest = Math.floor(rand() * 9_000_000) + 1_000_000
    out.push({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      nombre: `${first} ${last} ${i}`,
      nit: `${nitNumber}-${nitDv}`,
      telefono: `+57 ${phoneArea} ${phoneRest}`,
      ciudad,
      createdAt: new Date(now - i * 60_000).toISOString(),
      updatedAt: new Date(now - i * 60_000).toISOString(),
    })
  }
  return out
}

/** Canonical 3-item fixture used by the happy-path component tests. */
export const THREE_CLIENTES: Cliente[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    nombre: 'Acme S.A.',
    nit: '900123456-1',
    telefono: '+57 1 2223333',
    ciudad: 'Bogota',
    createdAt: '2026-05-30T10:00:00.000Z',
    updatedAt: '2026-05-30T10:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    nombre: 'Beta Corp',
    nit: '800000000-2',
    telefono: '+57 4 5556666',
    ciudad: 'Medellin',
    createdAt: '2026-05-29T10:00:00.000Z',
    updatedAt: '2026-05-29T10:00:00.000Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    nombre: 'José Pérez Distribuciones',
    nit: '700111222-3',
    telefono: '+57 2 7778888',
    ciudad: 'Cali',
    createdAt: '2026-05-28T10:00:00.000Z',
    updatedAt: '2026-05-28T10:00:00.000Z',
  },
]
