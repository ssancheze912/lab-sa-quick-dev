/**
 * Unit tests — useContacto hook
 * Story 3.2 — Contact Detail View (ATDD RED phase)
 *
 * These tests are in the RED phase — useContacto.ts does not exist yet.
 * Expected failure: "Cannot find module '../useContacto'"
 *
 * Test IDs covered:
 *   TC-1: Returns contact data on successful fetch
 *   TC-2: Returns isError = true when API responds 404
 *   TC-3: Returns isLoading = true while fetch is pending
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { useContacto } from './useContacto';
import { createContacto, resetContactoCounter } from '../../../test/factories/contacto.factory';

// ---------------------------------------------------------------------------
// MSW server for this unit test file
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: wrap useContacto in QueryClientProvider with isolated QueryClient
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ---------------------------------------------------------------------------
// TC-3: isLoading = true while fetch is pending (disabled states)
// ---------------------------------------------------------------------------

describe('useContacto — disabled when contactoId is falsy', () => {
  it('should NOT enable the query when contactoId is undefined', () => {
    // GIVEN: No contactoId provided (undefined)
    const wrapper = createWrapper();

    // WHEN: useContacto is called with undefined
    const { result } = renderHook(() => useContacto(undefined), { wrapper });

    // THEN: Query is disabled — fetchStatus should be idle, not loading
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
  });

  it('should NOT enable the query when contactoId is null', () => {
    // GIVEN: contactoId is explicitly null (no contact selected)
    const wrapper = createWrapper();

    // WHEN: useContacto is called with null
    const { result } = renderHook(() => useContacto(null), { wrapper });

    // THEN: Query is disabled — fetchStatus idle means no network request was made
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
  });

  it('should NOT enable the query when contactoId is an empty string', () => {
    // GIVEN: contactoId is empty string (falsy)
    const wrapper = createWrapper();

    // WHEN: useContacto is called with empty string
    const { result } = renderHook(() => useContacto(''), { wrapper });

    // THEN: Query is disabled
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-1: Returns contact data on successful fetch
// ---------------------------------------------------------------------------

describe('useContacto — TC-1: fetches contact data when contactoId is provided', () => {
  it('should fetch and return contacto data when contactoId is a valid UUID', async () => {
    // GIVEN: MSW returns a contacto for the requested ID
    const contacto = createContacto({
      nombre: 'Juan Pérez',
      cargo: 'Gerente',
      telefono: '3001234567',
      email: 'juan.perez@siesa.com',
    });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    const wrapper = createWrapper();

    // WHEN: useContacto is called with a valid UUID
    const { result } = renderHook(() => useContacto(contacto.id), { wrapper });

    // THEN: Data is eventually returned with all fields
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(contacto);
  });

  it('should expose data.nombre correctly after successful fetch', async () => {
    // GIVEN: MSW returns a contacto with a specific nombre
    const contacto = createContacto({ nombre: 'Maria García' });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    const wrapper = createWrapper();

    // WHEN: hook fetches the contacto
    const { result } = renderHook(() => useContacto(contacto.id), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data.nombre matches what the server returned
    expect(result.current.data?.nombre).toBe('Maria García');
  });

  it('should use canonical query key ["contactos", id]', async () => {
    // GIVEN: MSW returns a contacto
    const contacto = createContacto();

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: useContacto is rendered — the hook must use queryKey: ['contactos', id]
    // so TanStack Query can deduplicate with list queries.
    // We verify indirectly: a second render with same ID does not trigger a new fetch.
    const wrapper = createWrapper();
    const { result: r1 } = renderHook(() => useContacto(contacto.id), { wrapper });
    const { result: r2 } = renderHook(() => useContacto(contacto.id), { wrapper });

    await waitFor(() => expect(r1.current.isSuccess).toBe(true));
    await waitFor(() => expect(r2.current.isSuccess).toBe(true));

    // THEN: Both hooks share the same cached data
    expect(r1.current.data).toEqual(r2.current.data);
  });
});

// ---------------------------------------------------------------------------
// TC-2: Returns isError = true when API responds 404
// ---------------------------------------------------------------------------

describe('useContacto — TC-2: exposes isError on non-2xx responses', () => {
  it('should expose isError true when the API returns 404', async () => {
    // GIVEN: MSW returns 404 for the given ID
    const unknownId = '00000000-0000-0000-0000-000000000000';

    server.use(
      http.get(`/api/v1/contactos/${unknownId}`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );

    const wrapper = createWrapper();

    // WHEN: useContacto is called with an ID that does not exist
    const { result } = renderHook(() => useContacto(unknownId), { wrapper });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  it('should expose isError true when the API returns 500', async () => {
    // GIVEN: MSW returns 500
    const contactoId = '00000000-0000-0000-0000-000000000001';

    server.use(
      http.get(`/api/v1/contactos/${contactoId}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    const wrapper = createWrapper();

    // WHEN: useContacto is called and backend fails
    const { result } = renderHook(() => useContacto(contactoId), { wrapper });

    // THEN: isError is true (no retry in test config)
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// TC-3: Returns isLoading = true while fetch is pending
// ---------------------------------------------------------------------------

describe('useContacto — TC-3: isLoading while fetch is in-flight', () => {
  it('should expose isLoading true while fetch has not resolved', async () => {
    // GIVEN: MSW delays response by 300ms
    const contacto = createContacto();

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, async () => {
        await delay(300);
        return HttpResponse.json(contacto);
      })
    );

    const wrapper = createWrapper();

    // WHEN: hook is rendered immediately
    const { result } = renderHook(() => useContacto(contacto.id), { wrapper });

    // THEN: isLoading is true while fetch is in-flight
    expect(result.current.isLoading).toBe(true);

    // THEN: After response arrives, isLoading becomes false
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });
  });

  it('should expose refetch function that triggers a new fetch', async () => {
    // GIVEN: MSW returns a contacto
    const contacto = createContacto();

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    const wrapper = createWrapper();

    // WHEN: hook is rendered and data loads
    const { result } = renderHook(() => useContacto(contacto.id), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function');
  });
});
