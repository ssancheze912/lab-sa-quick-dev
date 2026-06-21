/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Unit Tests — Edge Cases & Boundary Conditions (BMad-Integrated Expansion)
 * Expands ATDD coverage with edge cases not covered in filterClientes.test.ts.
 *
 * New Test Cases:
 *   TC-2.1-U-06 — Single-character query matches correctly
 *   TC-2.1-U-07 — Query that matches both nombre AND nit returns item once
 *   TC-2.1-U-08 — Accented / Unicode characters in nombre are matched by exact substring
 *   TC-2.1-U-09 — Very long query string (>100 chars) returns empty array without throwing
 *   TC-2.1-U-10 — Empty clients array returns empty array
 *   TC-2.1-U-11 — Single-item array filtered correctly
 *   TC-2.1-U-12 — Query with leading/trailing spaces is trimmed before matching
 *   TC-2.1-U-13 — Multiple consecutive spaces in nombre are matched correctly
 *   TC-2.1-U-14 — Numeric-only query matches partial NIT
 *   TC-2.1-U-15 — Query matching all items returns full array
 */

import { describe, it, expect } from 'vitest';
import { filterClientes } from '../filterClientes';
import type { Cliente } from '../../domain/Cliente';

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Factory
// ─────────────────────────────────────────────────────────────────────────────

let _seq = 1000;

function makeCliente(overrides: Partial<Cliente> = {}): Cliente {
  const id = _seq++;
  return {
    id: `00000000-0000-0000-0001-${String(id).padStart(12, '0')}`,
    nombre: `Empresa Edge ${id}`,
    nit: `8${String(id).padStart(8, '0')}-2`,
    telefono: `311${String(id).padStart(7, '0')}`,
    ciudad: 'Medellín',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-06 — Single-character query
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — single-character query', () => {
  it('[P1][TC-2.1-U-06] Given clients, When query is a single character, Then only clients whose nombre or nit includes that character are returned', () => {
    // GIVEN: Three clients
    const clientes = [
      makeCliente({ nombre: 'Alpha SA', nit: '900000001-0' }),
      makeCliente({ nombre: 'Beta Ltda', nit: '900000002-0' }),
      makeCliente({ nombre: 'Zeta Corp', nit: '700000003-0' }),
    ];

    // WHEN: Single char query "Z"
    const result = filterClientes(clientes, 'Z');

    // THEN: Only "Zeta Corp" matches by nombre
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Zeta Corp');
  });

  it('[P1][TC-2.1-U-06b] Given clients, When query is single digit, Then clients whose NIT contains that digit are returned', () => {
    // GIVEN
    const clientes = [
      makeCliente({ nombre: 'Only Numbers Corp', nit: '111111111-0' }),
      makeCliente({ nombre: 'Another Corp', nit: '222222222-0' }),
    ];

    // WHEN
    const result = filterClientes(clientes, '1');

    // THEN: "Only Numbers Corp" matches via NIT
    expect(result).toHaveLength(1);
    expect(result[0].nit).toBe('111111111-0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-07 — Query matching both nombre AND nit — no duplicates
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — query matches both nombre and nit', () => {
  it('[P1][TC-2.1-U-07] Given a client whose nombre AND nit both contain the query, When filtered, Then the client appears exactly once', () => {
    // GIVEN: Client where both nombre and nit contain "abc"
    const clientes = [
      makeCliente({ nombre: 'Servicios ABC Ltda', nit: 'abc-123456-7' }),
      makeCliente({ nombre: 'Empresa Normal', nit: '900000009-1' }),
    ];

    // WHEN
    const result = filterClientes(clientes, 'abc');

    // THEN: The matching client appears EXACTLY once (no duplication from OR logic)
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Servicios ABC Ltda');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-08 — Accented / Unicode characters
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — accented/Unicode characters in nombre', () => {
  it('[P2][TC-2.1-U-08] Given clients with accented nombres, When query includes accent, Then exact accent-sensitive substring match is returned', () => {
    // GIVEN: Cliente with accent in nombre
    const clientes = [
      makeCliente({ nombre: 'Distribuciones Técnicas SAS' }),
      makeCliente({ nombre: 'Distribuciones Tecnicas SAS' }), // no accent
    ];

    // WHEN: Query includes accent
    const result = filterClientes(clientes, 'Técnicas');

    // THEN: Only the accented version matches (implementation does toLowerCase, not normalize)
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Distribuciones Técnicas SAS');
  });

  it('[P2][TC-2.1-U-08b] Given clients with Unicode characters, When filter runs, Then it does not throw and returns correct results', () => {
    // GIVEN: Clients with various Unicode chars
    const clientes = [
      makeCliente({ nombre: 'Compañía Colombia SA' }),
      makeCliente({ nombre: 'Empresa Normal' }),
    ];

    // WHEN: Query with ñ
    expect(() => filterClientes(clientes, 'ñía')).not.toThrow();
    const result = filterClientes(clientes, 'ñía');

    // THEN: Matching company found
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Compañía Colombia SA');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-09 — Very long query string (boundary condition)
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — very long query string', () => {
  it('[P2][TC-2.1-U-09] Given clients, When query is >100 characters long, Then function returns empty array without throwing', () => {
    // GIVEN
    const clientes = [makeCliente(), makeCliente()];
    const longQuery = 'a'.repeat(200);

    // WHEN / THEN: Does not throw
    expect(() => filterClientes(clientes, longQuery)).not.toThrow();

    // AND: Returns empty array (no client nombre/nit is 200 chars of "a")
    const result = filterClientes(clientes, longQuery);
    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-10 — Empty clients array
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — empty input array', () => {
  it('[P1][TC-2.1-U-10] Given empty clients array, When filter runs with any query, Then returns empty array', () => {
    // GIVEN: Empty array
    const clientes: Cliente[] = [];

    // WHEN: Filter with a real query
    const result = filterClientes(clientes, 'Empresa');

    // THEN: Returns empty array without errors
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('[P1][TC-2.1-U-10b] Given empty clients array, When filter runs with empty query, Then returns empty array', () => {
    // GIVEN: Empty array
    const clientes: Cliente[] = [];

    // WHEN: Empty query (would normally return all)
    const result = filterClientes(clientes, '');

    // THEN: Returns empty array
    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-11 — Single-item array
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — single-item array boundary', () => {
  it('[P1][TC-2.1-U-11] Given array with one client, When query matches, Then that one client is returned', () => {
    // GIVEN
    const clientes = [makeCliente({ nombre: 'Única Empresa SAS', nit: '900777888-5' })];

    // WHEN
    const result = filterClientes(clientes, 'Única');

    // THEN
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Única Empresa SAS');
  });

  it('[P1][TC-2.1-U-11b] Given array with one client, When query does NOT match, Then empty array is returned', () => {
    // GIVEN
    const clientes = [makeCliente({ nombre: 'Única Empresa SAS', nit: '900777888-5' })];

    // WHEN
    const result = filterClientes(clientes, 'XXXYYY');

    // THEN
    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-12 — Query leading/trailing spaces behavior (trim)
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — query leading/trailing space behavior', () => {
  it('[P2][TC-2.1-U-12] Given a query with leading/trailing spaces, When whitespace-only query, Then returns all clients (trim behavior)', () => {
    // GIVEN
    const clientes = [makeCliente(), makeCliente(), makeCliente()];

    // WHEN: Query is only spaces — treated as empty after trim
    const result = filterClientes(clientes, '     ');

    // THEN: All clients returned (empty query behavior)
    expect(result).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-13 — Multiple consecutive spaces in nombre
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — multiple spaces in nombre', () => {
  it('[P2][TC-2.1-U-13] Given a client nombre with multiple spaces, When query matches substring across spaces, Then client is returned', () => {
    // GIVEN: nombre has double space
    const clientes = [
      makeCliente({ nombre: 'Empresa  Colombia SA' }), // double space
      makeCliente({ nombre: 'Empresa Normal' }),
    ];

    // WHEN: query contains double space
    const result = filterClientes(clientes, 'Empresa  Colombia');

    // THEN: Only the double-space nombre matches
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Empresa  Colombia SA');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-14 — Numeric-only query matching partial NIT
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — numeric-only query', () => {
  it('[P1][TC-2.1-U-14] Given clients, When query is numeric digits, Then clients whose NIT starts with those digits are returned', () => {
    // GIVEN
    const clientes = [
      makeCliente({ nombre: 'Corp A', nit: '9001234567-0' }),
      makeCliente({ nombre: 'Corp B', nit: '9002345678-0' }),
      makeCliente({ nombre: 'Corp C', nit: '8003456789-0' }),
    ];

    // WHEN: Query is leading NIT digits
    const result = filterClientes(clientes, '900');

    // THEN: Corp A and Corp B match (both start with 900)
    expect(result).toHaveLength(2);
    const nombres = result.map((c) => c.nombre);
    expect(nombres).toContain('Corp A');
    expect(nombres).toContain('Corp B');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-U-15 — Query matching all items
// ─────────────────────────────────────────────────────────────────────────────

describe('filterClientes — query matching all items', () => {
  it('[P1][TC-2.1-U-15] Given clients that all share a common substring in nombre, When query matches that substring, Then all clients are returned', () => {
    // GIVEN: All clients share "SA" in their nombre
    const clientes = [
      makeCliente({ nombre: 'Alpha SA' }),
      makeCliente({ nombre: 'Beta SA' }),
      makeCliente({ nombre: 'Gamma SA' }),
    ];

    // WHEN: Query is "SA"
    const result = filterClientes(clientes, 'SA');

    // THEN: All 3 clients returned
    expect(result).toHaveLength(3);
  });
});
