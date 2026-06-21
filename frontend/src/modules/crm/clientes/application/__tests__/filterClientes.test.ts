/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Unit Tests — RED Phase (filter function)
 * These tests are intentionally FAILING until implementation is complete.
 * Uses: Vitest
 *
 * Acceptance Criteria covered:
 *   AC#2 — Real-time filter returns < 1s with up to 500 records
 *
 * Test Cases:
 *   TC-2.1-U-01 — filterClientes matches by nombre (case-insensitive)
 *   TC-2.1-U-02 — filterClientes matches by nit (case-insensitive)
 *   TC-2.1-U-03 — filterClientes returns all items when query is empty
 *   TC-2.1-U-04 — filterClientes returns empty array when no match
 *   TC-2.1-U-05 — filterClientes handles hyphens and slashes in NIT input (R-003, P2)
 *   TC-2.1-P0-02 — filterClientes over 500-item array completes in < 200ms (R-003)
 */

import { describe, it, expect } from 'vitest';

// Function under test — does not exist yet (RED phase)
// Will be extracted from ClienteListView as a pure function
import { filterClientes } from '../filterClientes';

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Factory
// ─────────────────────────────────────────────────────────────────────────────

let _counter = 1;

function buildCliente(overrides: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  const id = _counter++;
  return {
    id: `00000000-0000-0000-0000-${String(id).padStart(12, '0')}`,
    nombre: `Empresa ${id}`,
    nit: `9${String(id).padStart(8, '0')}-1`,
    telefono: `300${String(id).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildClientes(count: number) {
  return Array.from({ length: count }, () => buildCliente());
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-01 — Filter matches by nombre (case-insensitive)
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — nombre matching', () => {
  it('[P0][TC-2.1-U-01] Given clients array, When query matches Nombre, Then only matching clients are returned', () => {
    // GIVEN: Array with two clients, different nombres
    const clientes = [
      buildCliente({ nombre: 'Acme Solutions' }),
      buildCliente({ nombre: 'Beta Industries' }),
    ];

    // WHEN: Filter by "Acme"
    const result = filterClientes(clientes, 'Acme');

    // THEN: Only Acme is returned
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Acme Solutions');
  });

  it('[P0][TC-2.1-U-01b] Given clients array, When query is uppercase but nombre is mixed case, Then match is case-insensitive', () => {
    // GIVEN: Client with mixed case nombre
    const clientes = [buildCliente({ nombre: 'acme solutions Colombia' })];

    // WHEN: Filter with uppercase query
    const result = filterClientes(clientes, 'ACME');

    // THEN: Client is found (case-insensitive match)
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('acme solutions Colombia');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-02 — Filter matches by nit (case-insensitive)
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — nit matching', () => {
  it('[P0][TC-2.1-U-02] Given clients array, When query matches NIT, Then only clients with that NIT are returned', () => {
    // GIVEN: Array with two clients, different NITs
    const clientes = [
      buildCliente({ nombre: 'Cliente A', nit: '900111222-3' }),
      buildCliente({ nombre: 'Cliente B', nit: '700444555-6' }),
    ];

    // WHEN: Filter by partial NIT
    const result = filterClientes(clientes, '900111');

    // THEN: Only Cliente A is returned
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Cliente A');
  });

  it('[P0][TC-2.1-U-02b] Given clients array, When full NIT entered, Then exact match is returned', () => {
    // GIVEN: Client with specific NIT
    const clientes = [
      buildCliente({ nit: '900123456-7' }),
      buildCliente({ nit: '800987654-3' }),
    ];

    // WHEN: Full NIT entered
    const result = filterClientes(clientes, '900123456-7');

    // THEN: Only one client returned
    expect(result).toHaveLength(1);
    expect(result[0].nit).toBe('900123456-7');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-03 — Empty query returns all items
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — empty query', () => {
  it('[P0][TC-2.1-U-03] Given clients array, When query is empty string, Then all clients are returned', () => {
    // GIVEN: Array with 3 clients
    const clientes = [buildCliente(), buildCliente(), buildCliente()];

    // WHEN: Filter with empty query
    const result = filterClientes(clientes, '');

    // THEN: All clients returned
    expect(result).toHaveLength(3);
  });

  it('[P0][TC-2.1-U-03b] Given clients array, When query is whitespace only, Then all clients are returned (trim behavior)', () => {
    // GIVEN: Array with 2 clients
    const clientes = [buildCliente(), buildCliente()];

    // WHEN: Filter with whitespace-only query
    const result = filterClientes(clientes, '   ');

    // THEN: All clients returned (whitespace trimmed → treated as empty)
    expect(result).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-04 — No match returns empty array
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — no match', () => {
  it('[P1][TC-2.1-U-04] Given clients array, When query matches no client, Then empty array is returned', () => {
    // GIVEN: Array with clients that do NOT match the query
    const clientes = [
      buildCliente({ nombre: 'Alpha Corp', nit: '100200300-4' }),
      buildCliente({ nombre: 'Beta Ltda', nit: '500600700-8' }),
    ];

    // WHEN: Filter with a query that matches neither
    const result = filterClientes(clientes, 'zzznonexistent');

    // THEN: Empty array returned
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-05 — Handles hyphens and slashes in NIT input (P2)
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — special characters in NIT', () => {
  it('[P2][TC-2.1-U-05] Given NIT contains hyphens, When user types NIT with hyphen, Then filter works without errors', () => {
    // GIVEN: Client with hyphenated NIT
    const clientes = [buildCliente({ nit: '900-123-456-7' })];

    // WHEN: User types NIT including hyphen (does not throw)
    expect(() => filterClientes(clientes, '900-123')).not.toThrow();

    const result = filterClientes(clientes, '900-123');
    expect(result).toHaveLength(1);
  });

  it('[P2][TC-2.1-U-05b] Given NIT contains slashes, When user types NIT with slash, Then filter works without errors', () => {
    // GIVEN: Client with slash in NIT (RUC format)
    const clientes = [buildCliente({ nit: '20/12345678/1' })];

    // WHEN: User types NIT with slash (does not throw)
    expect(() => filterClientes(clientes, '20/12345')).not.toThrow();

    const result = filterClientes(clientes, '20/12345');
    expect(result).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-P0-02 — Filter over 500-item array < 200ms (R-003 performance)
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — performance (R-003)', () => {
  it('[P0][TC-2.1-P0-02] Given 500-item array, When filter executes, Then it completes in < 200ms', () => {
    // GIVEN: 500 clients in array
    const clientes = buildClientes(498);
    // Add target at arbitrary position
    clientes.push(buildCliente({ nombre: 'TargetClientePerformance', nit: '999888777-0' }));
    clientes.push(buildCliente({ nombre: 'AnotherTarget', nit: '111222333-4' }));

    // WHEN: Filter executes — measure time
    const start = performance.now();
    const result = filterClientes(clientes, 'TargetClientePerformance');
    const elapsed = performance.now() - start;

    // THEN: Result is correct
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('TargetClientePerformance');

    // AND: Filter completes in < 200ms (conservative; real target < 50ms)
    expect(elapsed).toBeLessThan(200);
  });
});
