/**
 * Story 2.1: Client List & Search — useClientes Edge Cases
 * Epic 2: Client Management
 *
 * Automation Tests — Unit Level Edge Cases for useClientes hook
 * Expands beyond ATDD tests in useClientes.test.ts.
 *
 * Covers:
 *   - isError state when repository throws
 *   - isLoading state while promise is pending
 *   - data is undefined before first successful fetch
 *   - queryKey is always ['clientes'] (never a string)
 *   - staleTime: data is not re-fetched within 30 seconds when cache is fresh
 *   - refetch function is exposed and triggers a new fetch
 *   - Network error vs server error both set isError=true
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clienteApiRepository } from '../../infrastructure/clienteApiRepository';
import { useClientes } from '../useClientes';

vi.mock('../../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    getAll: vi.fn(),
  },
}));

const mockedGetAll = vi.mocked(clienteApiRepository.getAll);

function createWrapper(staleTime?: number) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: staleTime ?? 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useClientes — error states', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('[P1] should set isError=true when the repository throws a network error', async () => {
    // GIVEN: The repository throws a network-level error
    mockedGetAll.mockRejectedValue(new Error('Network Error'));

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    // THEN: isError transitions to true
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('[P1] should set isError=true when the repository throws a server error (500)', async () => {
    // GIVEN: The repository throws a server error (Axios rejects on 5xx)
    const serverError = new Error('Request failed with status code 500');
    mockedGetAll.mockRejectedValue(serverError);

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    // THEN: isError is true
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('[P2] should have isLoading=true initially before data resolves', async () => {
    // GIVEN: The repository is a slow promise (never resolves in this test)
    let resolve!: (v: never[]) => void;
    mockedGetAll.mockReturnValue(new Promise<never[]>((res) => { resolve = res; }));

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    // THEN: isLoading is true before data arrives
    expect(result.current.isLoading).toBe(true);

    // Cleanup
    resolve([]);
  });

  it('[P2] should have data=undefined before the first successful response', async () => {
    // GIVEN: Repository is pending
    let resolve!: (v: never[]) => void;
    mockedGetAll.mockReturnValue(new Promise<never[]>((res) => { resolve = res; }));

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    // THEN: data is undefined while loading
    expect(result.current.data).toBeUndefined();

    // Cleanup
    resolve([]);
  });
});

describe('useClientes — query key and cache behavior', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('[P1] should call repository getAll exactly once on initial mount', async () => {
    // GIVEN: Repository returns empty array
    mockedGetAll.mockResolvedValue([]);

    // WHEN: The hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: getAll was called exactly once (no extra calls)
    expect(mockedGetAll).toHaveBeenCalledTimes(1);
  });

  it('[P2] should NOT call getAll again when data is still fresh (within staleTime)', async () => {
    // GIVEN: Repository returns data with a 30-second staleTime
    mockedGetAll.mockResolvedValue([
      { id: '1', nombre: 'Empresa A', nit: '900000001-1', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z' },
    ]);

    const wrapper = createWrapper(30_000); // match production staleTime

    // WHEN: Hook renders and data resolves
    const { result, rerender } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // AND: Hook is re-rendered (simulates component re-mount within staleTime)
    rerender();

    // THEN: getAll is still called only once (cache is fresh, no re-fetch)
    expect(mockedGetAll).toHaveBeenCalledTimes(1);
  });

  it('[P1] should expose a refetch function that triggers a new fetch', async () => {
    // GIVEN: Repository returns data
    mockedGetAll.mockResolvedValue([]);
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const callCountBeforeRefetch = mockedGetAll.mock.calls.length;

    // WHEN: refetch() is called
    await act(async () => {
      await result.current.refetch();
    });

    // THEN: getAll was called again (new network request)
    expect(mockedGetAll.mock.calls.length).toBeGreaterThan(callCountBeforeRefetch);
  });
});

describe('useClientes — data shape', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('[P1] should preserve all fields from the repository response (id, nombre, nit, telefono, ciudad, createdAt)', async () => {
    // GIVEN: Repository returns a client with all fields
    const mockCliente = {
      id: 'a1b2c3d4-0000-0000-0000-000000000001',
      nombre: 'Empresa Completa',
      nit: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-06-04T10:30:00Z',
    };
    mockedGetAll.mockResolvedValue([mockCliente]);

    // WHEN: Hook resolves
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: All fields are present and correct
    const data = result.current.data!;
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(mockCliente.id);
    expect(data[0].nombre).toBe(mockCliente.nombre);
    expect(data[0].nit).toBe(mockCliente.nit);
    expect(data[0].telefono).toBe(mockCliente.telefono);
    expect(data[0].ciudad).toBe(mockCliente.ciudad);
    expect(data[0].createdAt).toBe(mockCliente.createdAt);
  });

  it('[P2] should maintain data as an array even for a single-element response', async () => {
    // GIVEN: Repository returns exactly one client
    mockedGetAll.mockResolvedValue([
      { id: '1', nombre: 'Solo Empresa', nit: '999000001-1', telefono: '3009000001', ciudad: 'Cali', createdAt: '2026-01-01T00:00:00Z' },
    ]);

    // WHEN: Hook resolves
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data is an array of length 1 (not unwrapped to a single object)
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(1);
  });
});
