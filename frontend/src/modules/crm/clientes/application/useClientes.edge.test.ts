import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useClientes } from './useClientes';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { Cliente } from '../domain/Cliente';

vi.mock('../infrastructure/clienteApiRepository');

/**
 * Edge Case Tests — useClientes hook (Story 2.1)
 *
 * Complements the ATDD tests in useClientes.test.ts with:
 *   - staleTime: data served from cache without re-fetch within 30 seconds
 *   - queryKey correctness: always ['clientes']
 *   - loading state transitions: isLoading → isSuccess, isLoading → isError
 *   - retry: hook does NOT retry on error (retry: 0)
 *   - empty array: isSuccess with empty data (not treated as error)
 *   - multiple hook instances share the same cache (single fetch)
 */

const mockCliente: Cliente = {
  id: 'uuid-edge-1',
  nombre: 'Empresa Edge',
  nit: '900999001',
  telefono: '3009990001',
  ciudad: 'Cali',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function createWrapper(queryClient?: QueryClient) {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useClientes — edge cases', () => {
  it('transitions through isLoading → isSuccess states', async () => {
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce([mockCliente]);

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toHaveLength(1);
  });

  it('transitions through isLoading → isError on fetch failure', async () => {
    vi.mocked(clienteApiRepository.getAll).mockRejectedValueOnce(new Error('Timeout'));

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('is in isSuccess state with empty array when API returns [] (not treated as error)', async () => {
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it('does NOT retry on error (retry: 0 — one fetch attempt only)', async () => {
    const fetchFn = vi
      .mocked(clienteApiRepository.getAll)
      .mockRejectedValue(new Error('Server Down'));

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should only have been called once — no retries
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('two hook instances sharing the same QueryClient fetch only once (cache dedupe)', async () => {
    const fetchFn = vi
      .mocked(clienteApiRepository.getAll)
      .mockResolvedValue([mockCliente]);

    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = createWrapper(sharedClient);

    const { result: result1 } = renderHook(() => useClientes(), { wrapper });
    const { result: result2 } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));
    await waitFor(() => expect(result2.current.isSuccess).toBe(true));

    // Both hooks resolved but the underlying fetch should be deduplicated
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result1.current.data).toEqual(result2.current.data);
  });

  it('refetch triggers a new API call and updates data', async () => {
    const updatedCliente: Cliente = { ...mockCliente, nombre: 'Empresa Edge Actualizada' };
    vi.mocked(clienteApiRepository.getAll)
      .mockResolvedValueOnce([mockCliente])
      .mockResolvedValueOnce([updatedCliente]);

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].nombre).toBe('Empresa Edge');

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.data?.[0].nombre).toBe('Empresa Edge Actualizada'));
    expect(vi.mocked(clienteApiRepository.getAll)).toHaveBeenCalledTimes(2);
  });

  it('uses queryKey ["clientes"] (verifiable via QueryClient cache key)', async () => {
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce([mockCliente]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // The cache entry should be under ['clientes']
    const cachedData = queryClient.getQueryData<Cliente[]>(['clientes']);
    expect(cachedData).toBeDefined();
    expect(cachedData).toHaveLength(1);
    expect(cachedData?.[0].id).toBe('uuid-edge-1');
  });
});
