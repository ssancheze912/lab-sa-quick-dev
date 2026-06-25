import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useUpdateCliente } from './useUpdateCliente';

// ─── MSW server ───────────────────────────────────────────────────────────────

const CLIENTE_ID = '550e8400-e29b-41d4-a716-446655440000';
const PUT_URL = `http://localhost:5000/api/v1/clientes/${CLIENTE_ID}`;

const updatedClienteStub = {
  id: CLIENTE_ID,
  nombre: 'Empresa Actualizada S.A.',
  nit: '900123456-7',
  telefono: '6019876543',
  ciudad: 'Medellín',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-06-25T11:00:00Z',
};

const server = setupServer(
  http.put(PUT_URL, () => HttpResponse.json(updatedClienteStub, { status: 200 })),
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

describe('useUpdateCliente', () => {
  it('should call PUT /api/v1/clientes/{id} with correct payload', async () => {
    let capturedBody: unknown;
    server.use(
      http.put(PUT_URL, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(updatedClienteStub, { status: 200 });
      }),
    );

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    const payload = {
      nombre: 'Empresa Actualizada S.A.',
      nit: '900123456-7',
      telefono: '6019876543',
      ciudad: 'Medellín',
    };

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedBody).toEqual(payload);
  });

  it('should invalidate clientes queries on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), { wrapper });

    result.current.mutate({
      nombre: 'Empresa',
      nit: '900000001-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes', CLIENTE_ID] });
  });

  it('should have isError true with status 409 on conflict response', async () => {
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      nombre: 'Empresa',
      nit: '900000001-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
  });

  it('should have isError true on 5xx response', async () => {
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useUpdateCliente(CLIENTE_ID), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      nombre: 'Empresa',
      nit: '900000001-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
  });
});
