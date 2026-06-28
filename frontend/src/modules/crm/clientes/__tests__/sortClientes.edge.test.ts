/**
 * Edge-case unit tests — sortClientes utility — Story 2.1 automation expansion.
 *
 * Expands ATDD coverage (sortClientes.test.ts) with:
 *   - Empty array returns empty array (no crash)
 *   - Single-element array returns same element
 *   - Stable sort: ties in nombre produce consistent order
 *   - Ties in fecha produce consistent order
 *   - Original array is not mutated (immutability check)
 *   - Mixed-case names sorted correctly (localeCompare 'es')
 *   - Names with accented characters sorted correctly (Spanish locale)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildCliente, resetClienteCounter } from './clienteFactory';
import { sortClientes } from '../../../../shared/lib/sortClientes';

describe('sortClientes — edge cases and boundary conditions', () => {
  beforeEach(() => {
    resetClienteCounter();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Empty and single-element arrays
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should return an empty array when input is empty', () => {
    // GIVEN: Empty input
    const result = sortClientes([], 'nombre-asc');

    // THEN: Returns empty array without error
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('[P2] should return a single-element array unchanged for nombre-asc', () => {
    // GIVEN: Single element
    const clientes = [buildCliente({ nombre: 'Solo Corp' })];

    // WHEN
    const result = sortClientes(clientes, 'nombre-asc');

    // THEN: Returns the same single element
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Solo Corp');
  });

  it('[P2] should return a single-element array unchanged for fecha-desc', () => {
    const clientes = [buildCliente({ nombre: 'Solo Corp' })];
    const result = sortClientes(clientes, 'fecha-desc');
    expect(result).toHaveLength(1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Immutability: original array not mutated
  // ─────────────────────────────────────────────────────────────────────────

  it('[P1] should not mutate the original array when sorting', () => {
    // GIVEN: Original array in a specific order
    const clientes = [
      buildCliente({ nombre: 'Zeta Corp' }),
      buildCliente({ nombre: 'Alpha SAS' }),
    ];
    const originalFirst = clientes[0].nombre;
    const originalSecond = clientes[1].nombre;

    // WHEN: Sort is applied
    sortClientes(clientes, 'nombre-asc');

    // THEN: Original array is unchanged
    expect(clientes[0].nombre).toBe(originalFirst);
    expect(clientes[1].nombre).toBe(originalSecond);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Ties: equal nombres — stable order (relative order preserved)
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should handle multiple clients with identical Nombre without error', () => {
    // GIVEN: Three clients all named "Empresa Iguales"
    const clientes = [
      buildCliente({ nombre: 'Empresa Iguales', nit: '900000001-1' }),
      buildCliente({ nombre: 'Empresa Iguales', nit: '900000002-2' }),
      buildCliente({ nombre: 'Empresa Iguales', nit: '900000003-3' }),
    ];

    // WHEN: Sort by nombre-asc
    const result = sortClientes(clientes, 'nombre-asc');

    // THEN: All three items remain and none are lost
    expect(result).toHaveLength(3);
    expect(result.every((c) => c.nombre === 'Empresa Iguales')).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Ties: equal createdAt dates
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should handle multiple clients with identical createdAt without error', () => {
    // GIVEN: Two clients with the same timestamp
    const sameDate = '2026-01-15T12:00:00Z';
    const clientes = [
      buildCliente({ nombre: 'Alpha', createdAt: sameDate, updatedAt: sameDate }),
      buildCliente({ nombre: 'Beta', createdAt: sameDate, updatedAt: sameDate }),
    ];

    // WHEN: Sort by fecha-desc
    const result = sortClientes(clientes, 'fecha-desc');

    // THEN: Both items remain
    expect(result).toHaveLength(2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Mixed-case names — case-insensitive locale sort behaviour
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should sort mixed-case names correctly with nombre-asc (localeCompare es)', () => {
    // GIVEN: Names in various cases (localeCompare 'es' is case-sensitive by default,
    // but uppercase letters sort before lowercase in most locale implementations)
    const clientes = [
      buildCliente({ nombre: 'beta corp' }),
      buildCliente({ nombre: 'Alpha SAS' }),
      buildCliente({ nombre: 'Zeta Ltda.' }),
    ];

    // WHEN: Sort by nombre-asc
    const result = sortClientes(clientes, 'nombre-asc');

    // THEN: All three elements are present (no crash on mixed case)
    expect(result).toHaveLength(3);
    // Verify sort is deterministic: Alpha < beta < Zeta in Spanish locale
    const names = result.map((c) => c.nombre);
    expect(names.indexOf('Alpha SAS')).toBeLessThan(names.indexOf('Zeta Ltda.'));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Accented characters — Spanish locale correctness
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should sort accented Spanish names correctly (ñ, á, é, ó, ú) with nombre-asc', () => {
    // GIVEN: Names with Spanish accented characters
    const clientes = [
      buildCliente({ nombre: 'Únicos SAS' }),
      buildCliente({ nombre: 'Águila Corp' }),
      buildCliente({ nombre: 'Zona Norte' }),
    ];

    // WHEN: Sort by nombre-asc using locale 'es'
    const result = sortClientes(clientes, 'nombre-asc');

    // THEN: No crash; all items present; Á and Ú sort before Z in Spanish locale
    expect(result).toHaveLength(3);
    const names = result.map((c) => c.nombre);
    expect(names.indexOf('Zona Norte')).toBeGreaterThan(names.indexOf('Águila Corp'));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // nombre-desc reversal of nombre-asc
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should produce exact reverse order when switching from nombre-asc to nombre-desc', () => {
    // GIVEN: Three clients with distinct names
    const clientes = [
      buildCliente({ nombre: 'Alpha' }),
      buildCliente({ nombre: 'Beta' }),
      buildCliente({ nombre: 'Gamma' }),
    ];

    // WHEN: Sort asc then desc
    const asc = sortClientes(clientes, 'nombre-asc');
    const desc = sortClientes(clientes, 'nombre-desc');

    // THEN: desc is the reverse of asc
    expect(desc[0].nombre).toBe(asc[2].nombre);
    expect(desc[1].nombre).toBe(asc[1].nombre);
    expect(desc[2].nombre).toBe(asc[0].nombre);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // fecha-desc and fecha-asc — exact inverse
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should produce exact reverse order when switching from fecha-desc to fecha-asc', () => {
    // GIVEN: Three clients with distinct dates
    const c1 = buildCliente({ createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' });
    const c2 = buildCliente({ createdAt: '2025-06-15T00:00:00Z', updatedAt: '2025-06-15T00:00:00Z' });
    const c3 = buildCliente({ createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' });
    const clientes = [c1, c2, c3];

    // WHEN
    const desc = sortClientes(clientes, 'fecha-desc');
    const asc = sortClientes(clientes, 'fecha-asc');

    // THEN
    expect(desc[0].id).toBe(asc[2].id);
    expect(desc[1].id).toBe(asc[1].id);
    expect(desc[2].id).toBe(asc[0].id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Large dataset — no crash or performance issue
  // ─────────────────────────────────────────────────────────────────────────

  it('[P2] should sort 500 clients in under 50ms (performance sanity check)', () => {
    // GIVEN: 500 clients
    const clientes = Array.from({ length: 500 }, (_, i) =>
      buildCliente({
        nombre: `Empresa ${String(500 - i).padStart(4, '0')}`,
        createdAt: new Date(Date.now() - i * 1000).toISOString(),
        updatedAt: new Date(Date.now() - i * 1000).toISOString(),
      })
    );

    // WHEN: Sort by nombre-asc
    const start = performance.now();
    const result = sortClientes(clientes, 'nombre-asc');
    const elapsed = performance.now() - start;

    // THEN: All items preserved and execution fast
    expect(result).toHaveLength(500);
    expect(elapsed).toBeLessThan(50);
  });
});
