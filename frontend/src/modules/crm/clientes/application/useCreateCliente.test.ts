import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useCreateCliente } from './useCreateCliente';

// ─── MSW server ───────────────────────────────────────────────────────────────

const POST_URL = 'http://localhost:5000/api/v1/clientes';

const clienteStub = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  nombre: 'Empresa Ejemplo S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
};

const validPayload = {
  nombre: 'Empresa Ejemplo S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
};

const server = setupServer(
  http.post(POST_URL, () => HttpResponse.json(clienteStub, { status: 201 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
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

describe('useCreateCliente', () => {
  it('should call POST /api/v1/clientes with the correct payload', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(POST_URL, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(clienteStub, { status: 201 });
      }),
    );

    const { result } = renderHook(() => useCreateCliente(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).toEqual(validPayload);
  });

  it('should call invalidateQueries with key ["clientes"] on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['clientes'] }),
    );
  });

  it('should expose isError true on 409 conflict response', async () => {
    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    const { result } = renderHook(() => useCreateCliente(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(validPayload);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
