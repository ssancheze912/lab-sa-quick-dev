/**
 * Story 2.1: Client List & Search — useClientes hook unit tests
 * Framework: Vitest + @tanstack/react-query + MSW
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createElement } from 'react';
import { useClientes } from './useClientes';

const mockClientes = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    nombre: 'Acme Colombia SAS',
    nit: '900123456-7',
    telefono: '+57 601 234 5678',
    ciudad: 'Bogotá',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
];

const server = setupServer(
  http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes))
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useClientes', () => {
  it('should return data from mocked API call', async () => {
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].nombre).toBe('Acme Colombia SAS');
  });

  it('should expose isError true when API returns 500', async () => {
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 })
      )
    );

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
  });
});
