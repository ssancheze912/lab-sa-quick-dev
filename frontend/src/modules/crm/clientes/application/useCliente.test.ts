/**
 * Unit Tests — useCliente hook (Story 2.2)
 * RED phase: all tests fail until useCliente.ts hook is implemented.
 *
 * Acceptance Criteria covered:
 *   AC-2: direct URL /clientes/:clienteId loads correct data from GET /api/v1/clientes/:id
 *   AC-3: unknown clienteId → isError === true (surfaces 404 from API)
 *
 * Test matrix (test-design-epic-2.md — Story 2.2):
 *   useCliente hook unit scenarios (co-located per story file spec):
 *     U-01 — MSW returns valid ClienteDto; hook returns correct Cliente data
 *     U-02 — MSW returns 404; isError === true
 *     U-03 — Hook is disabled when id is undefined; no network request made
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { createElement } from 'react';
import { server } from '../../../../test/mocks/server';
import { clienteFactory } from '../../../../test/factories/cliente.factory';

// SUT — does NOT exist yet; import will fail at compile time (RED phase)
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

// ---------------------------------------------------------------------------
// U-01 — Happy path: returns correct Cliente data from API (P0)
// ---------------------------------------------------------------------------
describe('useCliente', () => {
  it(
    'GIVEN MSW returns a valid ClienteDto for a specific id '
    + 'WHEN useCliente is called with that id '
    + 'THEN it returns the correct Cliente data with isError false',
    async () => {
      const cliente = clienteFactory({ nombre: 'Detail Corp', nit: '800999001', ciudad: 'Bogotá' });

      server.use(
        http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      );

      const { result } = renderHook(() => useCliente(cliente.id), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.data?.id).toBe(cliente.id);
      expect(result.current.data?.nombre).toBe('Detail Corp');
      expect(result.current.data?.nit).toBe('800999001');
      expect(result.current.data?.ciudad).toBe('Bogotá');
    },
  );

  // ---------------------------------------------------------------------------
  // U-02 — 404 from API: isError === true (P1)
  // ---------------------------------------------------------------------------
  it(
    'GIVEN MSW returns 404 for a specific id '
    + 'WHEN useCliente is called with that id '
    + 'THEN isError is true',
    async () => {
      const unknownId = '00000000-0000-0000-0000-999999999999';

      server.use(
        http.get(`/api/v1/clientes/${unknownId}`, () =>
          HttpResponse.json(
            { status: 404, title: 'Not Found', detail: 'Cliente no encontrado.' },
            { status: 404 },
          ),
        ),
      );

      const { result } = renderHook(() => useCliente(unknownId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
    },
  );

  // ---------------------------------------------------------------------------
  // U-03 — Disabled when id is undefined: no network request (P1)
  // ---------------------------------------------------------------------------
  it(
    'GIVEN no id is provided '
    + 'WHEN useCliente is called with undefined '
    + 'THEN the hook does not issue any network request and data is undefined',
    async () => {
      let requestCount = 0;

      server.use(
        http.get('/api/v1/clientes/:id', () => {
          requestCount += 1;
          return HttpResponse.json({});
        }),
      );

      const { result } = renderHook(() => useCliente(undefined), {
        wrapper: createWrapper(),
      });

      // Wait a tick to confirm no request is fired
      await new Promise((r) => setTimeout(r, 50));

      expect(requestCount).toBe(0);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    },
  );
});
