/**
 * Story 2.1: Client List & Search
 * Epic 2: Gestión de Clientes
 *
 * Unit / Hook Tests — RED Phase (Vitest)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — useClientes returns array of Cliente objects on success
 *   AC4 — useClientes exposes isError and refetch when fetch fails
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock the infrastructure repository — tests control network behavior
vi.mock('@/modules/crm/clientes/infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    getAll: vi.fn(),
  },
}));

import { clienteApiRepository } from '@/modules/crm/clientes/infrastructure/clienteApiRepository';
const mockGetAll = vi.mocked(clienteApiRepository.getAll);

// Import the hook under test
// This import will fail (RED phase) until the hook is created
import { useClientes } from '@/modules/crm/clientes/application/useClientes';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Do not retry on error in tests
        gcTime: 0,
      },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { wrapper, queryClient };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Hook returns data on successful fetch
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — AC1: Returns client data on success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an array of Cliente objects when repository resolves successfully', async () => {
    // GIVEN: The repository returns 2 clients
    const mockClientes = [
      {
        id: 'aaaaaaaa-0000-0000-0000-000000000001',
        nombre: 'Empresa Alpha',
        nitRuc: '900100001-1',
        telefono: null,
        ciudad: null,
        creadoEn: '2026-01-10T08:00:00Z',
      },
      {
        id: 'aaaaaaaa-0000-0000-0000-000000000002',
        nombre: 'Beta Servicios',
        nitRuc: '900200002-2',
        telefono: '+57 601 2222222',
        ciudad: 'Medellín',
        creadoEn: '2026-01-11T09:00:00Z',
      },
    ];
    mockGetAll.mockResolvedValue(mockClientes);

    const { wrapper } = buildWrapper();

    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper });

    // THEN: The clientes array is returned with correct data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.clientes).toHaveLength(2);
    expect(result.current.clientes?.[0].nombre).toBe('Empresa Alpha');
    expect(result.current.clientes?.[1].nitRuc).toBe('900200002-2');
  });

  it('returns isLoading=true while the repository is pending', async () => {
    // GIVEN: The repository has a pending promise
    let resolveFn!: (value: never[]) => void;
    mockGetAll.mockReturnValue(new Promise((resolve) => { resolveFn = resolve; }));

    const { wrapper } = buildWrapper();

    // WHEN: useClientes hook is rendered (before data arrives)
    const { result } = renderHook(() => useClientes(), { wrapper });

    // THEN: isLoading is true before the promise resolves
    expect(result.current.isLoading).toBe(true);

    // Cleanup
    resolveFn([]);
  });

  it('returns empty array when repository resolves with empty array', async () => {
    // GIVEN: No clients exist (API returns empty array)
    mockGetAll.mockResolvedValue([]);

    const { wrapper } = buildWrapper();

    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: clientes is an empty array
    expect(result.current.clientes).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('exposes a refetch function', async () => {
    // GIVEN: The repository returns data
    mockGetAll.mockResolvedValue([]);

    const { wrapper } = buildWrapper();

    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function');
  });

  it('uses queryKey ["clientes"] so cache is consistent', async () => {
    // GIVEN: A QueryClient with a pre-seeded cache for key ["clientes"]
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const cachedClientes = [
      {
        id: 'cached-id',
        nombre: 'Cached Empresa',
        nitRuc: '111000111-1',
        telefono: null,
        ciudad: null,
        creadoEn: '2026-01-01T00:00:00Z',
      },
    ];
    queryClient.setQueryData(['clientes'], cachedClientes);

    // Mock getAll to return something different (should not be called if cache is fresh)
    mockGetAll.mockResolvedValue([]);

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    // WHEN: useClientes is called with the pre-seeded cache
    const { result } = renderHook(() => useClientes(), { wrapper });

    // THEN: The hook returns data from cache without calling the API
    expect(result.current.clientes).toEqual(cachedClientes);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Hook exposes isError and refetch on fetch failure
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — AC4: Error state when repository throws', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for expected errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets isError=true when the repository throws an error', async () => {
    // GIVEN: The repository rejects (simulates network failure or 500)
    mockGetAll.mockRejectedValue(new Error('Network Error'));

    const { wrapper } = buildWrapper();

    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper });

    // THEN: isError becomes true after the fetch fails
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('sets isLoading=false when error state is reached', async () => {
    // GIVEN: The repository rejects
    mockGetAll.mockRejectedValue(new Error('Server Error'));

    const { wrapper } = buildWrapper();

    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isLoading is false (not stuck in loading state)
    expect(result.current.isLoading).toBe(false);
  });

  it('provides refetch function even in error state', async () => {
    // GIVEN: The repository is in error state
    mockGetAll.mockRejectedValue(new Error('Timeout'));

    const { wrapper } = buildWrapper();

    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: refetch is still available as a function (for "Reintentar" button)
    expect(typeof result.current.refetch).toBe('function');
  });
});
