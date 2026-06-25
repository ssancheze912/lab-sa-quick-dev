/**
 * Story 3.1: useContactos hook — Unit Tests
 *
 * Acceptance Criteria covered:
 * - AC1: useContactos returns the list of contacts (data from API)
 * - AC4: useContactos exposes an error state and a refetch function
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { useContactos } from './useContactos';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000/api/v1/contactos';

const contactoStub = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  nombre: 'Juan Pérez',
  cargo: 'Gerente Comercial',
  telefono: '3001234567',
  email: 'juan.perez@empresa.com',
  clienteId: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2026-06-25T10:30:00Z',
  updatedAt: '2026-06-25T10:30:00Z',
};

const server = setupServer(
  http.get(API_URL, () => HttpResponse.json([contactoStub])),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helper wrapper ───────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useContactos', () => {
  it('should use queryKey ["contactos"]', async () => {
    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });

  it('should return data array with contact objects on success', async () => {
    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]).toMatchObject({
      id: contactoStub.id,
      nombre: contactoStub.nombre,
      email: contactoStub.email,
    });
  });

  it('should expose isLoading true before data arrives', async () => {
    server.use(
      http.get(API_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json([]);
      }),
    );

    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
  });

  it('should expose isError true and error object when API fails', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('should expose a refetch function on error state', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return empty array when API returns empty array', async () => {
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    const { result } = renderHook(() => useContactos(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});
