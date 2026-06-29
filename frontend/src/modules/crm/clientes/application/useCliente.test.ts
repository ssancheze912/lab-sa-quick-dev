/**
 * Unit tests — useCliente application hook
 * Story 2.2 — Client Detail View (ATDD RED phase)
 *
 * Test IDs covered:
 *   AC #6 — useQuery is NOT enabled when clienteId is null/undefined
 *
 * Expected RED failure:
 *   "Cannot find module './useCliente'"
 *
 * Test stack: Vitest
 */

import { describe, it, expect, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @tanstack/react-query so we can spy on useQuery's enabled option.
// ---------------------------------------------------------------------------

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { enabled?: boolean }) => {
    mockUseQuery(options);
    return { data: undefined, isLoading: false, isError: false };
  },
}));

// ---------------------------------------------------------------------------
// We mock the repository so the test doesn't need an actual HTTP layer.
// ---------------------------------------------------------------------------

vi.mock('../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    getById: vi.fn(),
  },
}));

// Import AFTER mocks are set up.
import { useCliente } from './useCliente';

// ---------------------------------------------------------------------------
// AC #6: useQuery is disabled when clienteId is null or undefined
// ---------------------------------------------------------------------------

describe('useCliente — enabled guard (AC #6)', () => {
  it('should NOT enable the query when clienteId is null', () => {
    // GIVEN: clienteId is null (no client selected)
    mockUseQuery.mockClear();

    // WHEN: useCliente is called with null
    useCliente(null);

    // THEN: useQuery was called with enabled: false
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it('should NOT enable the query when clienteId is undefined', () => {
    // GIVEN: clienteId is undefined
    mockUseQuery.mockClear();

    // WHEN: useCliente is called with undefined
    useCliente(undefined);

    // THEN: useQuery was called with enabled: false
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it('should NOT enable the query when clienteId is an empty string', () => {
    // GIVEN: clienteId is an empty string
    mockUseQuery.mockClear();

    // WHEN: useCliente is called with empty string
    useCliente('');

    // THEN: useQuery was called with enabled: false (empty string is falsy)
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it('should enable the query when clienteId is a valid UUID string', () => {
    // GIVEN: clienteId is a valid UUID
    mockUseQuery.mockClear();
    const clienteId = '00000000-0000-0000-0000-000000000001';

    // WHEN: useCliente is called with a valid ID
    useCliente(clienteId);

    // THEN: useQuery was called with enabled: true
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true })
    );
  });

  it('should use queryKey ["clientes", clienteId] for the single-item query', () => {
    // GIVEN: A valid clienteId
    mockUseQuery.mockClear();
    const clienteId = '00000000-0000-0000-0000-000000000002';

    // WHEN: useCliente is called
    useCliente(clienteId);

    // THEN: queryKey follows the canonical pattern ['clientes', clienteId]
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['clientes', clienteId] })
    );
  });
});
