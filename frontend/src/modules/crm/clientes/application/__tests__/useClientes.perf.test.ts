/**
 * Unit / Performance Test — useClientes filter (Story 2.1, NFR1)
 * RED phase: test fails until the filtering logic is implemented.
 *
 * Acceptance Criterion covered:
 *   AC-2 (NFR1): search results appear in under 1s with up to 500 records
 *
 * Test matrix (test-design-epic-2.md — Story 2.1):
 *   U-01 — 500-item filter via useMemo completes in < 50ms (P0, R-205)
 *
 * Strategy: tests the pure filter function extracted from ClienteListView
 * via the exported `filterClientes` utility. This keeps the test fast, isolated,
 * and independent of React rendering overhead.
 */

import { describe, it, expect } from 'vitest';
import { clienteListFactory } from '../../../../../test/factories/cliente.factory';

// SUT — pure filter function that will be extracted from ClienteListView.
// Does NOT exist yet → import fails (RED phase).
import { filterClientes } from '../filterClientes';

describe('filterClientes — NFR1 performance: 500 records < 50ms', () => {
  it(
    'GIVEN a list of 500 clients '
    + 'WHEN filterClientes is called with a search query '
    + 'THEN the filtering completes in under 50ms',
    () => {
      // GIVEN: 500-item fixture
      const clientes = clienteListFactory(500);
      const query = 'Empresa';

      // WHEN: filter runs and we measure elapsed time
      const start = performance.now();
      const result = filterClientes(clientes, query);
      const elapsed = performance.now() - start;

      // THEN: filter completes within NFR1 budget (50ms for CPU, well under 1s total)
      expect(elapsed).toBeLessThan(50);

      // Sanity check: returned items contain the query
      expect(result.length).toBeGreaterThan(0);
      result.forEach((c) => {
        const matchesNombre = c.nombre.toLowerCase().includes(query.toLowerCase());
        const matchesNit = c.nit.toLowerCase().includes(query.toLowerCase());
        expect(matchesNombre || matchesNit).toBe(true);
      });
    },
  );

  it(
    'GIVEN a list of 500 clients '
    + 'WHEN filterClientes is called with an empty query '
    + 'THEN all 500 items are returned unchanged',
    () => {
      // GIVEN: 500-item fixture
      const clientes = clienteListFactory(500);

      // WHEN: empty search
      const result = filterClientes(clientes, '');

      // THEN: full list returned
      expect(result).toHaveLength(500);
    },
  );

  it(
    'GIVEN a list of 500 clients '
    + 'WHEN filterClientes is called with a query matching no client '
    + 'THEN an empty array is returned',
    () => {
      // GIVEN: no client has NIT or nombre matching this string
      const clientes = clienteListFactory(500);

      // WHEN: query that matches nothing
      const result = filterClientes(clientes, 'XXXXXNOEXISTXXXXX');

      // THEN: empty result
      expect(result).toHaveLength(0);
    },
  );
});
