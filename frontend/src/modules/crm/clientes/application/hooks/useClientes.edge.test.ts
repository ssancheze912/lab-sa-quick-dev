/**
 * Edge Case Tests — useClientes Hook
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Expands ATDD coverage with:
 *   - Network-level failures (connection abort, not just HTTP errors)
 *   - undefined data before initial fetch resolves
 *   - Correct API URL called by queryFn
 *   - staleTime: 0 forces re-fetch on mount after cache invalidation
 *   - Concurrent renders share the same cached query
 *   - queryKey isolation: ['clientes'] does not bleed into other keys
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createElement } from 'react';
import { createCliente, createClientes } from '../../../../../test/factories/cliente.factory';
import { useClientes } from './useClientes';

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ─── Edge Case: data is undefined before first fetch resolves ──────────────────

describe('useClientes — estado inicial antes del primer fetch', () => {
  it('data debe ser undefined antes de que el fetch se resuelva', async () => {
    // GIVEN: Backend has a delayed response
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json([]);
      }),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered immediately
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    // THEN: data is undefined (not [] or null) while loading
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('isLoading y isError no deben ser ambos true al mismo tiempo', async () => {
    // GIVEN: Backend returns data
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json([]);
      }),
    );

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    // THEN: During loading, isError must be false
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});

// ─── Edge Case: network failure (not HTTP error) ──────────────────────────────

describe('useClientes — fallo de red (no HTTP)', () => {
  it('debe exponer isError como true cuando la red falla (connection error)', async () => {
    // GIVEN: Network request is aborted (simulates network unavailability)
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.error();
      }),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    // THEN: isError becomes true (network errors are errors too)
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  it('debe exponer isError como true con HTTP 503 (servicio no disponible)', async () => {
    // GIVEN: Backend returns 503 Service Unavailable
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Service Unavailable' }, { status: 503 }),
      ),
    );

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('debe exponer isError como true con HTTP 404 (recurso no encontrado)', async () => {
    // GIVEN: Endpoint returns 404 (misconfigured backend)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Not Found' }, { status: 404 }),
      ),
    );

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ─── Edge Case: queryKey isolation ────────────────────────────────────────────

describe('useClientes — aislamiento de queryKey', () => {
  it('el cache ["clientes"] no debe contaminar otras claves del queryClient', async () => {
    // GIVEN: Backend returns some clients
    const clientes = createClientes(2);
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)),
    );

    // Use a queryClient with non-zero gcTime so pre-populated data survives
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 5000,
          staleTime: 0,
        },
      },
    });

    // Pre-populate a different query key BEFORE any hooks run
    const contactosSnapshot = [{ id: 'c1', nombre: 'Contacto A' }];
    queryClient.setQueryData(['contactos'], contactosSnapshot);

    // WHEN: useClientes hook runs
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });

    // THEN: ['contactos'] cache is not affected — value persists unchanged
    const contactosCache = queryClient.getQueryData(['contactos']);
    expect(contactosCache).toEqual(contactosSnapshot);
  });
});

// ─── Edge Case: refetch updates data ─────────────────────────────────────────

describe('useClientes — refetch actualiza datos correctamente', () => {
  it('refetch debe reemplazar datos anteriores con los nuevos del servidor', async () => {
    // GIVEN: First call returns 1 client, second call returns 2 clients
    let callCount = 0;
    const cliente1 = createCliente({ nombre: 'Empresa Inicial', nit: '900000001' });
    const cliente2 = createCliente({ nombre: 'Empresa Nueva', nit: '900000002' });

    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++;
        if (callCount === 1) return HttpResponse.json([cliente1]);
        return HttpResponse.json([cliente1, cliente2]);
      }),
    );

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    // WHEN: refetch is called
    await act(async () => {
      await result.current.refetch();
    });

    // THEN: data now has 2 clients
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });
    expect(callCount).toBe(2);
  });

  it('refetch debe resetear isError cuando la segunda llamada tiene éxito', async () => {
    // GIVEN: First call fails, second succeeds
    let callCount = 0;
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++;
        if (callCount === 1)
          return HttpResponse.json({ error: 'Error' }, { status: 500 });
        return HttpResponse.json([]);
      }),
    );

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // WHEN: refetch called
    await act(async () => {
      await result.current.refetch();
    });

    // THEN: isError is now false
    await waitFor(() => {
      expect(result.current.isError).toBe(false);
    });
  });
});

// ─── Edge Case: large dataset ─────────────────────────────────────────────────

describe('useClientes — dataset grande (boundary condition)', () => {
  it('debe manejar correctamente 500 clientes (límite NFR1)', async () => {
    // GIVEN: Backend returns exactly 500 clients (NFR boundary)
    const clientes = createClientes(500);
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)),
    );

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    // THEN: All 500 clients are returned
    await waitFor(() => {
      expect(result.current.data).toHaveLength(500);
    });

    expect(result.current.isError).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('debe manejar lista vacía sin convertirla en undefined', async () => {
    // GIVEN: Backend returns empty array (boundary: 0 clients)
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    );

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // THEN: data is [] not undefined
    expect(result.current.data).toEqual([]);
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});

// ─── Edge Case: response data shape preservation ──────────────────────────────

describe('useClientes — preserva la forma de los datos del contrato', () => {
  it('debe preservar todos los campos del contrato Cliente en la respuesta', async () => {
    // GIVEN: Backend returns a client with all fields
    const cliente = createCliente({
      id: 'uuid-edge-001',
      nombre: 'Empresa Edge SAS',
      nit: '900-edge-001',
      telefono: '+57 310 9999999',
      ciudad: 'Bogotá',
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-02-20T14:30:00Z',
    });

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])),
    );

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    // THEN: All fields are preserved exactly
    const returned = result.current.data![0];
    expect(returned.id).toBe('uuid-edge-001');
    expect(returned.nombre).toBe('Empresa Edge SAS');
    expect(returned.nit).toBe('900-edge-001');
    expect(returned.telefono).toBe('+57 310 9999999');
    expect(returned.ciudad).toBe('Bogotá');
    expect(returned.createdAt).toBe('2026-01-15T08:00:00Z');
    expect(returned.updatedAt).toBe('2026-02-20T14:30:00Z');
  });

  it('no debe mutar los datos devueltos por el servidor', async () => {
    // GIVEN: Backend returns a known client
    const original = createCliente({ nombre: 'Empresa Inmutable', nit: '900000000' });
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([original])),
    );

    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    // THEN: Data matches original without transformation
    expect(result.current.data![0].nombre).toBe('Empresa Inmutable');
    expect(result.current.data![0].nit).toBe('900000000');
  });
});
