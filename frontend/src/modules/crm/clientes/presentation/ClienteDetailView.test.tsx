/**
 * Component tests — ClienteDetailView
 * Story 2.2 — Client Detail View
 *
 * Test IDs covered (RED phase — component does not exist yet):
 *   TC-E2-P1-04  Click client in list → detail panel renders Nombre, NIT/RUC, Teléfono, Ciudad
 *   AC #4        MSW returns 404 → "Cliente no encontrado" shown, no crash
 *   AC #5        No clienteId selected → EmptyState with Spanish prompt rendered
 *   AC (loading) Loading skeleton shown while fetch is in-flight
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failure: "Cannot find module '../ClienteDetailView'"
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { ClienteDetailView } from '../ClienteDetailView';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

// Default handler for contactos — returns empty array unless overridden per test
const server = setupServer(
  http.get('/api/v1/contactos', () => HttpResponse.json([]))
);

beforeEach(() => {
  resetClienteCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: render ClienteDetailView with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderClienteDetailView(clienteId: string | null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// TC-E2-P1-04: Detail panel renders Nombre, NIT/RUC, Teléfono, Ciudad on item click
// ---------------------------------------------------------------------------

describe('TC-E2-P1-04: ClienteDetailView renders all client fields', () => {
  it('should display Nombre, NIT/RUC, Teléfono, Ciudad when clienteId resolves to a client', async () => {
    // GIVEN: MSW returns a complete client for a specific clienteId
    const cliente = createCliente({
      nombre: 'Acme Corp',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    // WHEN: ClienteDetailView is rendered with a valid clienteId
    renderClienteDetailView(cliente.id);

    // THEN: All 4 fields appear in the right panel
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    expect(screen.getByText('900123456-7')).toBeInTheDocument();
    expect(screen.getByText('3001234567')).toBeInTheDocument();
    expect(screen.getByText('Bogotá')).toBeInTheDocument();
  });

  it('should display field labels in Spanish', async () => {
    // GIVEN: A valid client returned by MSW
    const cliente = createCliente();

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    // WHEN: ClienteDetailView renders the client
    renderClienteDetailView(cliente.id);

    // THEN: Spanish field labels are visible
    await waitFor(() => {
      expect(screen.getByText(cliente.nombre)).toBeInTheDocument();
    });

    expect(screen.getByText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByText(/NIT/i)).toBeInTheDocument();
    expect(screen.getByText(/Teléfono/i)).toBeInTheDocument();
    expect(screen.getByText(/Ciudad/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC #5: Empty/default state when no client is selected
// ---------------------------------------------------------------------------

describe('AC#5: EmptyState when no clienteId provided', () => {
  it('should render EmptyState with Spanish prompt when clienteId is null', () => {
    // GIVEN: No client has been selected (clienteId is null)
    // WHEN: ClienteDetailView is rendered with clienteId=null
    renderClienteDetailView(null);

    // THEN: EmptyState with Spanish prompt "Selecciona un cliente" is rendered
    expect(screen.getByTestId('cliente-detail-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/selecciona un cliente/i)).toBeInTheDocument();
  });

  it('should NOT make any API request when clienteId is null', () => {
    // GIVEN: No client selected
    // WHEN: Rendered with null clienteId — server has onUnhandledRequest: 'error'
    // THEN: No request is made (server error handler would fire if it did)
    expect(() => renderClienteDetailView(null)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// AC #4: 404 handling — "Cliente no encontrado" shown gracefully
// ---------------------------------------------------------------------------

describe('AC#4: Not-found message for invalid clienteId', () => {
  it('should display "Cliente no encontrado" when MSW returns 404', async () => {
    // GIVEN: MSW returns 404 for the given clienteId
    const unknownId = '00000000-0000-0000-0000-000000000000';

    server.use(
      http.get(`/api/v1/clientes/${unknownId}`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );

    // WHEN: ClienteDetailView is rendered with a non-existent clienteId
    renderClienteDetailView(unknownId);

    // THEN: Not-found message shown in Spanish
    await waitFor(() => {
      expect(screen.getByText(/Cliente no encontrado/i)).toBeInTheDocument();
    });
  });

  it('should NOT cause a JavaScript crash when API returns 404', async () => {
    // GIVEN: MSW returns 404
    const unknownId = '00000000-0000-0000-0000-000000000000';

    server.use(
      http.get(`/api/v1/clientes/${unknownId}`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );

    // WHEN: Component renders — assert no throw
    expect(() => renderClienteDetailView(unknownId)).not.toThrow();

    // THEN: DOM remains intact (no blank screen)
    await waitFor(() => {
      expect(screen.getByText(/Cliente no encontrado/i)).toBeInTheDocument();
    });
  });

  it('should NOT display any client data fields when the client is not found', async () => {
    // GIVEN: MSW returns 404
    const unknownId = '00000000-0000-0000-0000-000000000000';

    server.use(
      http.get(`/api/v1/clientes/${unknownId}`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );

    // WHEN: Rendered with unknown ID
    renderClienteDetailView(unknownId);

    await waitFor(() => {
      expect(screen.getByText(/Cliente no encontrado/i)).toBeInTheDocument();
    });

    // THEN: No client data fields are rendered
    expect(screen.queryByText(/Teléfono/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC (loading): Skeleton shown while fetch is in-flight
// ---------------------------------------------------------------------------

describe('Loading skeleton during fetch', () => {
  it('should display loading skeleton while fetch is in-flight (MSW delayed response)', async () => {
    // GIVEN: MSW delays the response by 150ms
    const cliente = createCliente();

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, async () => {
        await delay(150);
        return HttpResponse.json(cliente);
      })
    );

    // WHEN: ClienteDetailView is rendered with a valid clienteId
    renderClienteDetailView(cliente.id);

    // THEN: Loading skeleton is visible before the response arrives
    expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument();

    // THEN: After response arrives, skeleton disappears and data is visible
    await waitFor(
      () => {
        expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(screen.getByText(cliente.nombre)).toBeInTheDocument();
    });
  });
});
