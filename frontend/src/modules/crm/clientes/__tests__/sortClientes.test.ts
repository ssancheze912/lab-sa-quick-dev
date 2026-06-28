/**
 * ATDD unit tests — Story 2.1: sortClientes utility (RED phase)
 *
 * Tests fail until sortClientes is implemented at:
 *   frontend/src/shared/lib/sortClientes.ts
 *
 * Test IDs:
 *   TC-E2-2-1-UNIT-1 (P2) — nombre-asc sorts A→Z
 *   TC-E2-2-1-UNIT-2 (P2) — nombre-desc sorts Z→A
 *   TC-E2-2-1-UNIT-3 (P2) — fecha-desc sorts newest first
 *   TC-E2-2-1-UNIT-4 (P2) — fecha-asc sorts oldest first
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildCliente, resetClienteCounter } from './clienteFactory';
// sortClientes does NOT exist yet — import will fail (RED phase)
import { sortClientes } from '../../../../shared/lib/sortClientes';

describe('sortClientes utility', () => {
  beforeEach(() => {
    resetClienteCounter();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-UNIT-1 — nombre-asc sorts A→Z
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E2-2-1-UNIT-1: should sort clientes A→Z by nombre when option is nombre-asc', () => {
    // GIVEN: A list of clientes with unordered names
    const clientes = [
      buildCliente({ nombre: 'Zeta Corp' }),
      buildCliente({ nombre: 'Alpha SAS' }),
      buildCliente({ nombre: 'Mediana Ltda.' }),
    ];

    // WHEN: sortClientes is called with 'nombre-asc'
    const result = sortClientes(clientes, 'nombre-asc');

    // THEN: The list is ordered alphabetically ascending (A→Z)
    expect(result[0].nombre).toBe('Alpha SAS');
    expect(result[1].nombre).toBe('Mediana Ltda.');
    expect(result[2].nombre).toBe('Zeta Corp');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-UNIT-2 — nombre-desc sorts Z→A
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E2-2-1-UNIT-2: should sort clientes Z→A by nombre when option is nombre-desc', () => {
    // GIVEN: A list of clientes with unordered names
    const clientes = [
      buildCliente({ nombre: 'Alpha SAS' }),
      buildCliente({ nombre: 'Zeta Corp' }),
      buildCliente({ nombre: 'Mediana Ltda.' }),
    ];

    // WHEN: sortClientes is called with 'nombre-desc'
    const result = sortClientes(clientes, 'nombre-desc');

    // THEN: The list is ordered alphabetically descending (Z→A)
    expect(result[0].nombre).toBe('Zeta Corp');
    expect(result[1].nombre).toBe('Mediana Ltda.');
    expect(result[2].nombre).toBe('Alpha SAS');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-UNIT-3 — fecha-desc sorts newest first
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E2-2-1-UNIT-3: should sort clientes newest first when option is fecha-desc', () => {
    // GIVEN: Three clientes with distinct createdAt dates
    const oldest = buildCliente({ createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' });
    const newest = buildCliente({ createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' });
    const middle = buildCliente({ createdAt: '2025-12-01T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z' });
    const clientes = [oldest, newest, middle];

    // WHEN: sortClientes is called with 'fecha-desc'
    const result = sortClientes(clientes, 'fecha-desc');

    // THEN: Newest client appears first
    expect(result[0].id).toBe(newest.id);
    expect(result[1].id).toBe(middle.id);
    expect(result[2].id).toBe(oldest.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-UNIT-4 — fecha-asc sorts oldest first
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E2-2-1-UNIT-4: should sort clientes oldest first when option is fecha-asc', () => {
    // GIVEN: Three clientes with distinct createdAt dates
    const oldest = buildCliente({ createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' });
    const newest = buildCliente({ createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' });
    const middle = buildCliente({ createdAt: '2025-12-01T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z' });
    const clientes = [newest, oldest, middle];

    // WHEN: sortClientes is called with 'fecha-asc'
    const result = sortClientes(clientes, 'fecha-asc');

    // THEN: Oldest client appears first
    expect(result[0].id).toBe(oldest.id);
    expect(result[1].id).toBe(middle.id);
    expect(result[2].id).toBe(newest.id);
  });
});
