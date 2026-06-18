/**
 * Unit Test — useClientes hook (Story 2.1)
 *
 * Acceptance Criteria covered:
 *   AC-1: hook returns correct Cliente[] data from API
 *
 * Test matrix (test-design-epic-2.md — Story 2.1):
 *   MSW handler returns array of 2 clients; assert hook returns correct data
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { createElement } from 'react';
import { server } from '../../../../test/mocks/server';
import { clienteFactory } from '../../../../test/factories/cliente.factory';
import { useClientes } from './useClientes';

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

describe('useClientes', () => {
  it(
    'GIVEN MSW returns 2 clients '
    + 'WHEN useClientes is called '
    + 'THEN it returns the correct Cliente[] data',
    async () => {
      const clienteA = clienteFactory({ nombre: 'Acme Corp', nit: '900111222' });
      const clienteB = clienteFactory({ nombre: 'Beta Ltda', nit: '900333444' });

      server.use(
        http.get('/api/v1/clientes', () => HttpResponse.json([clienteA, clienteB])),
      );

      const { result } = renderHook(() => useClientes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].nombre).toBe('Acme Corp');
      expect(result.current.data?.[1].nombre).toBe('Beta Ltda');
      expect(result.current.isError).toBe(false);
    },
  );
});
