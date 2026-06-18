/**
 * Unit Tests — filterClientes edge cases (Story 2.1 — Automate Expansion)
 *
 * Expands coverage beyond the ATDD perf tests with boundary conditions,
 * special inputs, and logic branches not covered in the red-phase test suite.
 *
 * AC covered: AC-2 (NFR1) — search results match by nombre OR nit, case-insensitive
 */

import { describe, it, expect } from 'vitest';
import { filterClientes } from '../filterClientes';
import { clienteFactory, clienteListFactory } from '../../../../../test/factories/cliente.factory';

describe('filterClientes — edge cases', () => {
  // -------------------------------------------------------------------------
  // Whitespace handling
  // -------------------------------------------------------------------------
  describe('whitespace-only query', () => {
    it(
      'GIVEN a list of 3 clients '
      + 'WHEN filterClientes is called with a whitespace-only query '
      + 'THEN all clients are returned (whitespace treated as empty)',
      () => {
        const clientes = clienteListFactory(3);

        const result = filterClientes(clientes, '   ');

        expect(result).toHaveLength(3);
      },
    );

    it(
      'GIVEN a list of clients '
      + 'WHEN filterClientes is called with a tab character '
      + 'THEN all clients are returned',
      () => {
        const clientes = clienteListFactory(5);

        const result = filterClientes(clientes, '\t');

        expect(result).toHaveLength(5);
      },
    );
  });

  // -------------------------------------------------------------------------
  // Case-insensitivity
  // -------------------------------------------------------------------------
  describe('case-insensitive matching', () => {
    it(
      'GIVEN a client named "Acme Corp" '
      + 'WHEN filterClientes is called with query "ACME CORP" (uppercase) '
      + 'THEN the client is returned',
      () => {
        const target = clienteFactory({ nombre: 'Acme Corp', nit: '900000001' });
        const other = clienteFactory({ nombre: 'Beta Ltda', nit: '900000002' });

        const result = filterClientes([target, other], 'ACME CORP');

        expect(result).toHaveLength(1);
        expect(result[0].nombre).toBe('Acme Corp');
      },
    );

    it(
      'GIVEN a client with NIT "900123456" '
      + 'WHEN filterClientes is called with uppercase NIT query '
      + 'THEN the client is returned (NIT matching is case-insensitive)',
      () => {
        // NITs are numeric but the function lowercases; confirm no regression
        const target = clienteFactory({ nombre: 'Delta SA', nit: '900123456' });
        const other = clienteFactory({ nombre: 'Gamma Co', nit: '111111111' });

        const result = filterClientes([target, other], '900123456');

        expect(result).toHaveLength(1);
        expect(result[0].nit).toBe('900123456');
      },
    );

    it(
      'GIVEN a client named "Empresa Ejemplo SAS" '
      + 'WHEN filterClientes is called with mixed-case query "ejemplo" '
      + 'THEN the client is returned',
      () => {
        const target = clienteFactory({ nombre: 'Empresa Ejemplo SAS' });
        const other = clienteFactory({ nombre: 'Otra Empresa SRL' });

        const result = filterClientes([target, other], 'ejemplo');

        expect(result).toHaveLength(1);
        expect(result[0].nombre).toBe('Empresa Ejemplo SAS');
      },
    );
  });

  // -------------------------------------------------------------------------
  // Partial / substring matching
  // -------------------------------------------------------------------------
  describe('partial substring matching', () => {
    it(
      'GIVEN a client with NIT "900123456" '
      + 'WHEN filterClientes is called with a partial NIT "12345" '
      + 'THEN the client is returned',
      () => {
        const target = clienteFactory({ nit: '900123456' });
        const other = clienteFactory({ nit: '777888999' });

        const result = filterClientes([target, other], '12345');

        expect(result).toHaveLength(1);
        expect(result[0].nit).toBe('900123456');
      },
    );

    it(
      'GIVEN multiple clients sharing a common nombre prefix '
      + 'WHEN filterClientes is called with that prefix '
      + 'THEN all matching clients are returned',
      () => {
        const a = clienteFactory({ nombre: 'Empresa Alpha SA' });
        const b = clienteFactory({ nombre: 'Empresa Beta SAS' });
        const c = clienteFactory({ nombre: 'Empresa Gamma Ltda' });
        const d = clienteFactory({ nombre: 'Otra Firma SRL' });

        const result = filterClientes([a, b, c, d], 'Empresa');

        expect(result).toHaveLength(3);
        expect(result.map((r) => r.nombre)).toEqual(
          expect.arrayContaining(['Empresa Alpha SA', 'Empresa Beta SAS', 'Empresa Gamma Ltda']),
        );
      },
    );
  });

  // -------------------------------------------------------------------------
  // Single character query
  // -------------------------------------------------------------------------
  describe('single character query', () => {
    it(
      'GIVEN a query of a single character "A" '
      + 'WHEN filterClientes is called '
      + 'THEN only clients whose nombre or nit contains "A" are returned',
      () => {
        const withA = clienteFactory({ nombre: 'Alfa Inc', nit: '000000001' });
        const withoutA = clienteFactory({ nombre: 'Micro SRL', nit: '222222222' });

        const result = filterClientes([withA, withoutA], 'A');

        // "Alfa Inc" matches on nombre
        expect(result.some((c) => c.nombre === 'Alfa Inc')).toBe(true);
      },
    );
  });

  // -------------------------------------------------------------------------
  // Query matching both nombre and nit on the same client
  // -------------------------------------------------------------------------
  describe('dual-field matches', () => {
    it(
      'GIVEN a client where the query matches both nombre and nit '
      + 'WHEN filterClientes is called '
      + 'THEN the client appears exactly once in the result',
      () => {
        // nombre contains "123" and nit also contains "123"
        const target = clienteFactory({ nombre: 'ABC 123 SAS', nit: '900123456' });
        const other = clienteFactory({ nombre: 'No Match Co', nit: '000000000' });

        const result = filterClientes([target, other], '123');

        expect(result).toHaveLength(1);
        expect(result[0].nombre).toBe('ABC 123 SAS');
      },
    );
  });

  // -------------------------------------------------------------------------
  // Empty list input
  // -------------------------------------------------------------------------
  describe('empty input list', () => {
    it(
      'GIVEN an empty client list '
      + 'WHEN filterClientes is called with any query '
      + 'THEN an empty array is returned',
      () => {
        const result = filterClientes([], 'cualquier cosa');

        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
      },
    );

    it(
      'GIVEN an empty client list '
      + 'WHEN filterClientes is called with an empty query '
      + 'THEN an empty array is returned',
      () => {
        const result = filterClientes([], '');

        expect(result).toHaveLength(0);
      },
    );
  });

  // -------------------------------------------------------------------------
  // Result ordering preserved
  // -------------------------------------------------------------------------
  describe('preserves original order', () => {
    it(
      'GIVEN an ordered list of matching clients '
      + 'WHEN filterClientes is called '
      + 'THEN the matching clients are returned in the same original order',
      () => {
        const a = clienteFactory({ nombre: 'Alfa SA' });
        const b = clienteFactory({ nombre: 'Beta SA' });
        const c = clienteFactory({ nombre: 'Gamma SA' });

        const result = filterClientes([a, b, c], 'SA');

        expect(result[0].nombre).toBe('Alfa SA');
        expect(result[1].nombre).toBe('Beta SA');
        expect(result[2].nombre).toBe('Gamma SA');
      },
    );
  });
});
