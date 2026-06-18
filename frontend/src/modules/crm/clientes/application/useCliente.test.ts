/**
 * Unit Test — useCliente hook (Story 2.2)
 *
 * Acceptance Criteria covered:
 *   AC-2: hook fetches correct client by id from API
 *   AC-3: hook surfaces 404 error when client not found
 *
 * Test matrix (test-design-epic-2.md — Story 2.2):
 *   MSW handler returns valid ClienteDto; assert hook returns correct Cliente data
 *   MSW handler returns 404; assert isError === true
 *   Hook is disabled when id is undefined
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { createElement } from 'react';
import { server } from '../../../../test/mocks/server';
import { clienteFactory } from '../../../../test/factories/cliente.factory';
import { useCliente } from './useCliente';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useCliente', () => {
  it('returns correct Cliente data when MSW returns valid ClienteDto', async () => {
    const mockCliente = clienteFactory({ nombre: 'Empresa Test SA', nit: '900111222' });

    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return HttpResponse.json(mockCliente);
      }),
    );

    const { result } = renderHook(() => useCliente(mockCliente.id), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toMatchObject({
      id: mockCliente.id,
      nombre: 'Empresa Test SA',
      nit: '900111222',
    });
  });

  it('sets isError to true when MSW returns 404', async () => {
    const id = '00000000-0000-0000-0000-000000000001';

    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'Cliente no encontrado.' },
          { status: 404 },
        );
      }),
    );

    const { result } = renderHook(() => useCliente(id), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
  });

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(() => useCliente(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
