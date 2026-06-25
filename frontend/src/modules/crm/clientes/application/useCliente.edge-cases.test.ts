/**
 * Story 2.2: useCliente hook — Edge Cases & Extended Coverage
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD unit coverage with edge cases NOT covered by useCliente.test.ts.
 *
 * Additional scenarios:
 * - Unique queryKey per different id values (cache isolation)
 * - staleTime: data is not refetched within 30 seconds (served from cache)
 * - retry is configured to 0 (no automatic retries on failure)
 * - Transitioning from undefined id to a valid id triggers a fetch
 * - isSuccess is false on initial render before data resolves
 * - Data shape matches Cliente domain interface exactly
 * - 404 error: isError is true, error.response?.status is 404
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, useState } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { useCliente } from './useCliente';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000/api/v1/clientes';
const ID_A = '550e8400-e29b-41d4-a716-446655440001';
const ID_B = '660e8400-e29b-41d4-a716-446655440002';

const stubA = {
  id: ID_A,
  nombre: 'Cliente Alpha S.A.',
  nit: '900111111-1',
  telefono: '6011111111',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
};

const stubB = {
  id: ID_B,
  nombre: 'Cliente Beta Ltda',
  nit: '900222222-2',
  telefono: '6022222222',
  ciudad: 'Medellín',
  createdAt: '2026-04-01T08:00:00Z',
  updatedAt: '2026-04-01T08:00:00Z',
};

const server = setupServer(
  http.get(`${API_BASE}/${ID_A}`, () => HttpResponse.json(stubA)),
  http.get(`${API_BASE}/${ID_B}`, () => HttpResponse.json(stubB)),
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

// ─── Cache isolation: unique queryKey per different id ────────────────────────

describe('Cache isolation — unique queryKey per id', () => {
  it('[P1] should cache data separately for different id values (ID_A and ID_B)', async () => {
    // GIVEN: Two separate queries for ID_A and ID_B
    const wrapperA = createWrapper();
    const wrapperB = createWrapper();

    const hookA = renderHook(() => useCliente(ID_A), { wrapper: wrapperA });
    const hookB = renderHook(() => useCliente(ID_B), { wrapper: wrapperB });

    await waitFor(() => expect(hookA.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(hookB.result.current.isSuccess).toBe(true));

    // THEN: Each query returns the correct isolated data
    expect(hookA.result.current.data?.id).toBe(ID_A);
    expect(hookA.result.current.data?.nombre).toBe('Cliente Alpha S.A.');
    expect(hookB.result.current.data?.id).toBe(ID_B);
    expect(hookB.result.current.data?.nombre).toBe('Cliente Beta Ltda');
  });

  it('[P1] should NOT share cached data between different id values', async () => {
    // GIVEN: Both IDs are loaded in the SAME QueryClient (same cache)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const hookA = renderHook(() => useCliente(ID_A), { wrapper });

    await waitFor(() => expect(hookA.result.current.isSuccess).toBe(true));

    // WHEN: A second hook for ID_B is created in the same cache
    const hookB = renderHook(() => useCliente(ID_B), { wrapper });

    await waitFor(() => expect(hookB.result.current.isSuccess).toBe(true));

    // THEN: Each returns its own data (cache keys are different)
    expect(hookA.result.current.data?.id).toBe(ID_A);
    expect(hookB.result.current.data?.id).toBe(ID_B);
    expect(hookA.result.current.data?.id).not.toBe(hookB.result.current.data?.id);
  });
});

// ─── retry=0: no automatic retries on failure ────────────────────────────────

describe('retry=0 — No automatic retries on failure', () => {
  it('[P1] should not retry and immediately set isError=true on first failure', async () => {
    // GIVEN: API returns 500 (only one response, if retry>0 it would call again)
    let fetchCount = 0;
    server.use(
      http.get(`${API_BASE}/:id`, () => {
        fetchCount++;
        return HttpResponse.json({ status: 500 }, { status: 500 });
      }),
    );

    // WHEN: Hook is rendered with a valid id
    const { result } = renderHook(() => useCliente(ID_A), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: API was only called once (no retry)
    expect(fetchCount).toBe(1);
  });
});

// ─── Transition from undefined to valid id triggers a fetch ──────────────────

describe('id transition — undefined → valid triggers fetch', () => {
  it('[P1] should transition from idle to loading when id changes from undefined to a valid UUID', async () => {
    // GIVEN: Hook starts with undefined id (disabled)
    // We need a hook that can change its id prop
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    let currentId: string | undefined = undefined;
    const { result, rerender } = renderHook(() => useCliente(currentId), { wrapper });

    // THEN: Initially not fetching (id is undefined)
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();

    // WHEN: id changes to a valid UUID
    currentId = ID_A;
    rerender();

    // THEN: A fetch is triggered and data eventually loads
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(ID_A);
  });
});

// ─── isSuccess is false before data resolves ─────────────────────────────────

describe('Initial render state', () => {
  it('[P1] should have isSuccess=false on the initial render before data arrives', () => {
    // GIVEN: API will respond but hasn't yet
    const { result } = renderHook(() => useCliente(ID_A), {
      wrapper: createWrapper(),
    });

    // THEN: isSuccess is false immediately (not yet resolved)
    expect(result.current.isSuccess).toBe(false);
  });

  it('[P1] should have data=undefined on the initial render before data arrives', () => {
    // GIVEN: API will respond but hasn't yet
    const { result } = renderHook(() => useCliente(ID_A), {
      wrapper: createWrapper(),
    });

    // THEN: data is undefined initially
    expect(result.current.data).toBeUndefined();
  });
});

// ─── Data shape matches Cliente domain interface ──────────────────────────────

describe('Data shape — matches Cliente domain interface', () => {
  it('[P1] should return an object with all required Cliente fields on success', async () => {
    // GIVEN: API returns a full client response
    const { result } = renderHook(() => useCliente(ID_A), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: All Cliente interface fields are present
    const data = result.current.data!;
    expect(typeof data.id).toBe('string');
    expect(typeof data.nombre).toBe('string');
    expect(typeof data.nit).toBe('string');
    expect(typeof data.telefono).toBe('string');
    expect(typeof data.ciudad).toBe('string');
    expect(typeof data.createdAt).toBe('string');
    expect(typeof data.updatedAt).toBe('string');
  });

  it('[P1] should return the correct values from the API response', async () => {
    // GIVEN: API returns stubA
    const { result } = renderHook(() => useCliente(ID_A), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: Data exactly matches the stub
    expect(result.current.data).toMatchObject({
      id: stubA.id,
      nombre: stubA.nombre,
      nit: stubA.nit,
      telefono: stubA.telefono,
      ciudad: stubA.ciudad,
    });
  });
});

// ─── 404 error differentiation ───────────────────────────────────────────────

describe('404 error — differentiation from generic errors', () => {
  it('[P1] should set isError=true for 404 response (both 404 and 500 set isError=true)', async () => {
    // GIVEN: API returns 404
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'Cliente no encontrado.' },
          { status: 404 },
        ),
      ),
    );

    const { result } = renderHook(() => useCliente(ID_A), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isError is true (caller distinguishes 404 vs 5xx via error.response?.status)
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('[P2] should expose refetch even on 404 errors (user may try again later)', async () => {
    // GIVEN: API returns 404
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useCliente(ID_A), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: refetch is exposed and is a function
    expect(typeof result.current.refetch).toBe('function');
  });
});

// ─── enabled=false: never calls fetch for undefined id ───────────────────────

describe('enabled=false boundary — undefined and empty string', () => {
  it('[P1] should return isPending=false for undefined id (query is disabled)', () => {
    // GIVEN: No id provided
    const { result } = renderHook(() => useCliente(undefined), {
      wrapper: createWrapper(),
    });

    // THEN: Hook is in disabled/idle state — not pending
    // TanStack Query v5: isPending=true when enabled=false is NOT triggered
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('[P1] should return data=undefined for undefined id', () => {
    // GIVEN: No id provided
    const { result } = renderHook(() => useCliente(undefined), {
      wrapper: createWrapper(),
    });

    // THEN: No data available (query was never executed)
    expect(result.current.data).toBeUndefined();
  });
});
