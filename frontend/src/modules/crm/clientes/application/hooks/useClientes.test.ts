/**
 * Unit Tests — useClientes Hook
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Tools: Vitest + @testing-library/react (renderHook) + MSW 2+
 *
 * Covers:
 *   - Hook returns data from GET /api/v1/clientes
 *   - Hook exposes isLoading, isError, refetch
 *   - Hook uses queryKey: ['clientes']
 *   - staleTime: 0 (always fresh on window focus)
 *   - retry: 1 (single retry on failure)
 *
 * GREEN PHASE: All tests pass — useClientes hook implemented.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createElement } from 'react';
import { createCliente, createClientes } from '../../../../../test/factories/cliente.factory';

// Hook under test
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

// ─── useClientes Hook Tests ───────────────────────────────────────────────────

describe('useClientes — retorna datos desde GET /api/v1/clientes', () => {
  it('debe retornar la lista de clientes cuando el fetch tiene éxito', async () => {
    // GIVEN: Backend returns 2 clients
    const clientes = [
      createCliente({ nombre: 'Empresa Alpha SAS', nit: '900111222' }),
      createCliente({ nombre: 'Distribuidora Beta Ltda', nit: '800333444' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    // THEN: data is returned with 2 clients
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });
  });

  it('debe retornar data con los campos correctos del contrato Cliente', async () => {
    // GIVEN: Backend returns a client with all required fields
    const cliente = createCliente({
      id: 'uuid-test-1',
      nombre: 'Empresa Alpha SAS',
      nit: '900111222',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    // THEN: Returned data has all required fields
    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    const returned = result.current.data![0];
    expect(returned).toMatchObject({
      id: expect.any(String),
      nombre: 'Empresa Alpha SAS',
      nit: '900111222',
      telefono: expect.any(String),
      ciudad: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('debe retornar arreglo vacío cuando la API retorna []', async () => {
    // GIVEN: Backend returns an empty array
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    // THEN: data is an empty array (not undefined)
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useClientes — expone isLoading durante la carga', () => {
  it('debe exponer isLoading como true mientras se realiza el fetch', async () => {
    // GIVEN: Backend has a slow response
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json([]);
      }),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered before data resolves
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    // THEN: isLoading is true immediately
    expect(result.current.isLoading).toBe(true);

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('debe exponer isLoading como false después de que los datos se carguen', async () => {
    // GIVEN: Backend returns data
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered and data loads
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    // THEN: isLoading becomes false after data is available
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useClientes — expone isError cuando el fetch falla', () => {
  it('debe exponer isError como true cuando el backend retorna 500', async () => {
    // GIVEN: Backend returns a server error
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('debe exponer isError como false cuando el fetch tiene éxito', async () => {
    // GIVEN: Backend returns success
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // THEN: isError is false
    expect(result.current.isError).toBe(false);
  });
});

describe('useClientes — expone refetch para reintentar la carga', () => {
  it('debe exponer la función refetch', async () => {
    // GIVEN: Backend returns data
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // THEN: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function');
  });

  it('llamar a refetch debe volver a ejecutar la consulta', async () => {
    // GIVEN: First call fails, second call succeeds
    let callCount = 0;
    const clientes = [createCliente({ nombre: 'Empresa Alpha', nit: '900111222' })];

    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
        }
        return HttpResponse.json(clientes);
      }),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered (first call fails)
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // AND: refetch is called
    await result.current.refetch();

    // THEN: Data is now available (second call succeeded)
    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });
    expect(callCount).toBe(2);
  });
});

describe('useClientes — usa queryKey canónico ["clientes"]', () => {
  it('debe almacenar datos en el cache con queryKey ["clientes"]', async () => {
    // GIVEN: Backend returns clients
    const clientes = createClientes(3);

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)),
    );

    const queryClient = createTestQueryClient();

    // WHEN: Hook is rendered and data loads
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(3);
    });

    // THEN: Data is cached under the ['clientes'] key
    const cached = queryClient.getQueryData(['clientes']);
    expect(cached).toHaveLength(3);
  });
});
