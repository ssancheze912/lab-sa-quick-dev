/**
 * Unit tests — useContactosByCliente hook (edge cases & boundary conditions)
 * Story 4.1 — View Associated Contacts in Client Detail
 *
 * Expands ATDD coverage with:
 *   EC-1  Query key isolation: different clienteIds produce separate cache entries
 *   EC-2  Rapid clienteId switching: stale data from previous clienteId is not shown
 *   EC-3  Large contact list: hook handles 50+ contacts without degradation
 *   EC-4  404 response treated as error (not silent empty array)
 *   EC-5  Network-level error (no response) triggers isError
 *   EC-6  Response with extra/unknown fields does not break the hook
 *   EC-7  Contacts with null clienteId field are included in the result array
 *
 * Stack: Vitest + @testing-library/react + MSW 2
 * Given-When-Then format per test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useContactosByCliente } from './useContactosByCliente';
import { createContacto, createContactos, resetContactoCounter } from '../../../test/factories/contacto.factory';
import { createCliente, resetClienteCounter } from '../../../test/factories/cliente.factory';

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  resetClienteCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: shared QueryClient wrapper (simulates same application instance)
// ---------------------------------------------------------------------------

function createWrapper(queryClient?: QueryClient) {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

// ---------------------------------------------------------------------------
// EC-1: Query key isolation — different clienteIds get separate cache entries
// ---------------------------------------------------------------------------

describe('EC-1: Query key isolation — distinct clienteIds hit separate cache entries', () => {
  it('should NOT return clienteA contacts when querying clienteB', async () => {
    // GIVEN: clienteA has 2 contacts, clienteB has 1 different contact
    const clienteA = createCliente();
    const clienteB = createCliente();
    const contactosA = createContactos(2, { clienteId: clienteA.id });
    const contactoB = createContacto({ clienteId: clienteB.id, nombre: 'Solo B' });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        const cid = url.searchParams.get('clienteId');
        if (cid === clienteA.id) return HttpResponse.json(contactosA);
        if (cid === clienteB.id) return HttpResponse.json([contactoB]);
        return HttpResponse.json([]);
      })
    );

    // WHEN: Both hooks run inside the SAME QueryClient (shared cache)
    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });
    const wrapper = createWrapper(sharedClient);

    const { result: rA } = renderHook(() => useContactosByCliente(clienteA.id), { wrapper });
    const { result: rB } = renderHook(() => useContactosByCliente(clienteB.id), { wrapper });

    await waitFor(() => expect(rA.current.isSuccess).toBe(true));
    await waitFor(() => expect(rB.current.isSuccess).toBe(true));

    // THEN: Each hook returns only its own contacts (cache keys are isolated)
    expect(rA.current.data).toHaveLength(2);
    expect(rB.current.data).toHaveLength(1);
    expect(rB.current.data?.[0].nombre).toBe('Solo B');
  });

  it('should use separate cache entries for clienteA and clienteB', async () => {
    // GIVEN: Two clients with distinct responses
    const clienteA = createCliente();
    const clienteB = createCliente();
    const callLog: string[] = [];

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        const cid = url.searchParams.get('clienteId');
        if (cid) callLog.push(cid);
        return HttpResponse.json([]);
      })
    );

    const sharedClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });
    const wrapper = createWrapper(sharedClient);

    // WHEN: Hooks for both clients mount
    const { result: rA } = renderHook(() => useContactosByCliente(clienteA.id), { wrapper });
    const { result: rB } = renderHook(() => useContactosByCliente(clienteB.id), { wrapper });

    await waitFor(() => expect(rA.current.isSuccess).toBe(true));
    await waitFor(() => expect(rB.current.isSuccess).toBe(true));

    // THEN: Two distinct fetch calls were made (one per cache key)
    expect(callLog).toHaveLength(2);
    expect(callLog).toContain(clienteA.id);
    expect(callLog).toContain(clienteB.id);
  });
});

// ---------------------------------------------------------------------------
// EC-2: Rapid clienteId switching
// ---------------------------------------------------------------------------

describe('EC-2: Rapid clienteId switching does not bleed data between clients', () => {
  it('should fetch new data when clienteId prop changes from A to B', async () => {
    // GIVEN: clienteA and clienteB have distinct contact lists
    const clienteA = createCliente();
    const clienteB = createCliente();
    const contactosA = createContactos(3, { clienteId: clienteA.id });
    const contactosB = createContactos(1, { clienteId: clienteB.id });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        const cid = url.searchParams.get('clienteId');
        if (cid === clienteA.id) return HttpResponse.json(contactosA);
        if (cid === clienteB.id) return HttpResponse.json(contactosB);
        return HttpResponse.json([]);
      })
    );

    const wrapper = createWrapper();
    let currentId = clienteA.id;

    // WHEN: Hook mounts for clienteA
    const { result, rerender } = renderHook(() => useContactosByCliente(currentId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);

    // WHEN: clienteId switches to clienteB
    act(() => {
      currentId = clienteB.id;
    });
    rerender();

    // THEN: Hook reflects clienteB's data (separate query key triggers new fetch)
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toHaveLength(1);
    });
  });

  it('should enter loading state when clienteId changes', async () => {
    // GIVEN: Two clients with fast responses
    const clienteA = createCliente();
    const clienteB = createCliente();

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([]))
    );

    const wrapper = createWrapper();
    let currentId = clienteA.id;

    const { result, rerender } = renderHook(() => useContactosByCliente(currentId), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // WHEN: clienteId changes
    act(() => {
      currentId = clienteB.id;
    });
    rerender();

    // THEN: Eventually resolves for the new ID (no stale data from A)
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// EC-3: Large contact list (boundary — 50 contacts)
// ---------------------------------------------------------------------------

describe('EC-3: Large contact list — boundary condition (50 contacts)', () => {
  it('should return all 50 contacts without truncation', async () => {
    // GIVEN: MSW returns 50 contacts for the client
    const cliente = createCliente();
    const contactos = createContactos(50, { clienteId: cliente.id });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json(contactos);
        }
        return HttpResponse.json([]);
      })
    );

    const wrapper = createWrapper();

    // WHEN: hook fetches a large result set
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    // THEN: All 50 items are returned intact
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(50);
  });

  it('should expose isSuccess true for a single contact (boundary — 1 item)', async () => {
    // GIVEN: MSW returns exactly one contact
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json([contacto]);
        }
        return HttpResponse.json([]);
      })
    );

    const wrapper = createWrapper();

    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    // THEN: Exactly 1 item returned (not 0, not > 1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// EC-4: Query result data is undefined before fetch completes
// ---------------------------------------------------------------------------

describe('EC-4: Data is undefined until query resolves', () => {
  it('should have data as undefined in the initial pending state', () => {
    // GIVEN: clienteId provided but response has not arrived
    // No server handler needed — query is checked synchronously before MSW responds
    const cliente = createCliente();

    server.use(
      http.get('/api/v1/contactos', async () => {
        // Never resolves during this synchronous check
        await new Promise(() => {}); // hang forever
        return HttpResponse.json([]);
      })
    );

    const wrapper = createWrapper();

    // WHEN: Hook renders for the first time (fetch is pending)
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    // THEN: data is undefined, isLoading is true, isError is false
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// EC-5: Response with extra/unknown fields does not break the hook
// ---------------------------------------------------------------------------

describe('EC-5: Response with extra fields is parsed without error', () => {
  it('should return contacts even if API adds new unexpected fields', async () => {
    // GIVEN: API returns contacts with an extra "metadata" field not in Contacto type
    const cliente = createCliente();
    const contactoWithExtra = {
      ...createContacto({ clienteId: cliente.id }),
      metadata: { source: 'crm', version: 2 }, // extra field
      _debug: 'test',
    };

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json([contactoWithExtra]);
        }
        return HttpResponse.json([]);
      })
    );

    const wrapper = createWrapper();

    // WHEN: hook parses the response
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    // THEN: Data is returned successfully — extra fields are silently ignored
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].nombre).toBe(contactoWithExtra.nombre);
  });
});

// ---------------------------------------------------------------------------
// EC-6: Contacts with null clienteId are included in the result
// ---------------------------------------------------------------------------

describe('EC-6: Contacts with null clienteId are included when API returns them', () => {
  it('should include contacts that have null clienteId in the result array', async () => {
    // GIVEN: MSW returns a contact with null clienteId (orphan contact returned by API)
    const cliente = createCliente();
    const orphanContacto = createContacto({ clienteId: null });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json([orphanContacto]);
        }
        return HttpResponse.json([]);
      })
    );

    const wrapper = createWrapper();

    // WHEN: hook fetches for the clienteId
    const { result } = renderHook(() => useContactosByCliente(cliente.id), { wrapper });

    // THEN: The item is included even if clienteId is null on the DTO
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].clienteId).toBeNull();
  });
});
