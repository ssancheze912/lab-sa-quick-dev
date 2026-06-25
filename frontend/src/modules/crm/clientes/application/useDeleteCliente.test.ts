import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useDeleteCliente } from './useDeleteCliente';

// ─── MSW server ───────────────────────────────────────────────────────────────

const CLIENTE_ID = '550e8400-e29b-41d4-a716-446655440000';
const DELETE_URL = `http://localhost:5000/api/v1/clientes/${CLIENTE_ID}`;

const server = setupServer(
  http.delete(DELETE_URL, () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// ─── Helper wrapper ───────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useDeleteCliente', () => {
  it('should call DELETE /api/v1/clientes/{id} with correct id', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.delete(`http://localhost:5000/api/v1/clientes/:id`, ({ params }) => {
        capturedUrl = params.id as string;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(CLIENTE_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toBe(CLIENTE_ID);
  });

  it('should invalidate clientes queries on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    result.current.mutate(CLIENTE_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] });
  });

  it('should have isError true on 404 response', async () => {
    server.use(
      http.delete(DELETE_URL, () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'Cliente no encontrado.' },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(CLIENTE_ID);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
  });

  it('should have isError true on 5xx response', async () => {
    server.use(
      http.delete(DELETE_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useDeleteCliente(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(CLIENTE_ID);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
  });
});
