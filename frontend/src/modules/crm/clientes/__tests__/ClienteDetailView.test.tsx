/**
 * ATDD component tests — Story 2.2: ClienteDetailView (RED phase)
 *
 * Tests fail until the following are implemented:
 *   - frontend/src/modules/crm/clientes/application/useCliente.ts
 *   - frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts (getById)
 *   - frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
 *   - frontend/src/shared/components/NotFoundPanel.tsx
 *   - frontend/src/shared/components/ErrorPanel.tsx (already created in Story 2.1)
 *
 * Test IDs:
 *   TC-E2-2-2-CMP-1 (P1) — ClienteDetailView with valid ID shows all 4 fields
 *   TC-E2-2-2-CMP-2 (P1) — ClienteDetailView with undefined clienteId shows placeholder
 *   TC-E2-2-2-CMP-3 (P1) — ClienteDetailView with MSW 500 shows ErrorPanel + "Reintentar"
 *   TC-E2-2-2-CMP-4 (P2) — ClienteDetailView with MSW 404 shows not-found message
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { buildCliente, resetClienteCounter } from './clienteFactory';

// ClienteDetailView does NOT exist yet — import will fail (RED phase)
import { ClienteDetailView } from '../presentation/ClienteDetailView';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress expected React query errors in test output
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('[MSW]') ||
    msg.includes('AxiosError') ||
    msg.includes('Request failed with status code')
  ) {
    return;
  }
  originalConsoleError(...args);
});

const API_BASE = 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup (network-first: handlers registered before tests run)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetClienteCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ClienteDetailView with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteDetailView(clienteId: string | undefined) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>
  );

  return { ...result, queryClient };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-2-CMP-2 (P1) — undefined clienteId shows placeholder text
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — no client selected (clienteId undefined)', () => {
  it('TC-E2-2-2-CMP-2: should show placeholder text when clienteId is undefined', () => {
    // GIVEN: No MSW handler needed — no fetch occurs when clienteId is undefined

    // WHEN: ClienteDetailView is rendered with clienteId={undefined}
    renderClienteDetailView(undefined);

    // THEN: Placeholder text is shown (in Spanish)
    expect(
      screen.getByText(/selecciona un cliente para ver su detalle/i)
    ).toBeInTheDocument();
  });

  it('should NOT render Nombre, NIT/RUC, Teléfono, or Ciudad when no client is selected', () => {
    // GIVEN: No client selected
    renderClienteDetailView(undefined);

    // THEN: No client data fields are rendered
    expect(screen.queryByText(/nit\/ruc/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/teléfono/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ciudad/i)).not.toBeInTheDocument();
  });

  it('should NOT trigger any network request when clienteId is undefined', () => {
    // GIVEN: A handler that fails loudly if called
    let wasCalled = false;
    server.use(
      http.get(`${CLIENTES_URL}/:id`, () => {
        wasCalled = true;
        return HttpResponse.json({}, { status: 500 });
      })
    );

    // WHEN: ClienteDetailView rendered with undefined
    renderClienteDetailView(undefined);

    // THEN: No network request was made (enabled: !!id guard)
    expect(wasCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-2-CMP-1 (P1) — Valid ID shows all 4 client fields
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — valid client loaded', () => {
  it('TC-E2-2-2-CMP-1: should display Nombre, NIT/RUC, Teléfono, and Ciudad when client is loaded', async () => {
    // GIVEN: NETWORK intercepted BEFORE render (network-first pattern)
    const cliente = buildCliente({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Acme Detalle SA',
      nit: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    // WHEN: ClienteDetailView is rendered with a valid clienteId
    renderClienteDetailView(cliente.id);

    // THEN: Nombre is displayed (as a heading)
    await waitFor(() => {
      expect(screen.getByText('Acme Detalle SA')).toBeInTheDocument();
    });

    // AND: NIT/RUC field with label and value is visible
    await waitFor(() => {
      expect(screen.getByText(/nit\/ruc/i)).toBeInTheDocument();
      expect(screen.getByText('900123456-1')).toBeInTheDocument();
    });

    // AND: Teléfono field is visible
    await waitFor(() => {
      expect(screen.getByText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByText('3001234567')).toBeInTheDocument();
    });

    // AND: Ciudad field is visible
    await waitFor(() => {
      expect(screen.getByText(/ciudad/i)).toBeInTheDocument();
      expect(screen.getByText('Bogotá')).toBeInTheDocument();
    });
  });

  it('should render Nombre as a heading with text-xl font-bold styling', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const cliente = buildCliente({
      id: '22222222-2222-2222-2222-222222222222',
      nombre: 'Empresa Titulo SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    // WHEN: Component renders
    renderClienteDetailView(cliente.id);

    // THEN: Nombre is rendered as a heading element
    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: /empresa titulo sa/i });
      expect(heading).toBeInTheDocument();
    });
  });

  it('should use data-testid="cliente-detail-panel" on the root container', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const cliente = buildCliente({
      id: '33333333-3333-3333-3333-333333333333',
      nombre: 'Empresa TestId SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    renderClienteDetailView(cliente.id);

    // THEN: Root container has expected data-testid
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-2-CMP-3 (P1) — MSW 500 shows ErrorPanel + "Reintentar" button
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — backend error (500)', () => {
  it('TC-E2-2-2-CMP-3: should show ErrorPanel with "Reintentar" button when fetch returns 500', async () => {
    // GIVEN: NETWORK intercepted BEFORE render, returning 500
    const clienteId = '44444444-4444-4444-4444-444444444444';

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(clienteId);

    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // AND: "Reintentar" button is visible
    await waitFor(() => {
      const retryButton = screen.getByRole('button', { name: /reintentar/i });
      expect(retryButton).toBeInTheDocument();
    });

    // AND: No client data is shown
    expect(screen.queryByText(/nit\/ruc/i)).not.toBeInTheDocument();
  });

  it('should trigger a new GET request when "Reintentar" button is clicked after 500 error', async () => {
    // GIVEN: First request fails with 500, second succeeds
    const clienteId = '55555555-5555-5555-5555-555555555555';
    const cliente = buildCliente({
      id: clienteId,
      nombre: 'Empresa Retry',
    });

    let requestCount = 0;
    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () => {
        requestCount += 1;
        if (requestCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json(cliente);
      })
    );

    renderClienteDetailView(clienteId);

    // Wait for ErrorPanel
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    const countBeforeRetry = requestCount;

    // WHEN: User clicks "Reintentar"
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    // THEN: A new request was made
    await waitFor(() => {
      expect(requestCount).toBeGreaterThan(countBeforeRetry);
    });

    // AND: Client data is now visible
    await waitFor(() => {
      expect(screen.getByText('Empresa Retry')).toBeInTheDocument();
    });
  });

  it('should show ErrorPanel when network request fails completely (network error)', async () => {
    // GIVEN: Network error (connection refused)
    const clienteId = '66666666-6666-6666-6666-666666666666';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () => HttpResponse.error())
    );

    // WHEN: ClienteDetailView renders
    renderClienteDetailView(clienteId);

    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-2-CMP-4 (P2) — MSW 404 shows not-found message (NOT ErrorPanel)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — 404 not found', () => {
  it('TC-E2-2-2-CMP-4: should show not-found message (not ErrorPanel) when fetch returns 404', async () => {
    // GIVEN: NETWORK intercepted BEFORE render, returning 404 Problem Details
    const clienteId = '77777777-7777-7777-7777-777777777777';

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Cliente no encontrado',
            status: 404,
            detail: 'El cliente solicitado no fue encontrado.',
          },
          { status: 404 }
        )
      )
    );

    // WHEN: ClienteDetailView is rendered with a clienteId that doesn't exist
    renderClienteDetailView(clienteId);

    // THEN: Not-found message is displayed (in Spanish)
    await waitFor(() => {
      expect(screen.getByText(/cliente no encontrado/i)).toBeInTheDocument();
    });

    // AND: Not-found panel element is present
    await waitFor(() => {
      expect(screen.getByTestId('not-found-panel')).toBeInTheDocument();
    });

    // AND: Generic ErrorPanel is NOT shown (404 uses distinct UX)
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });

  it('should display not-found description text for 404 response', async () => {
    // GIVEN: NETWORK intercepted BEFORE render, returning 404
    const clienteId = '88888888-8888-8888-8888-888888888888';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json({ status: 404, title: 'Cliente no encontrado' }, { status: 404 })
      )
    );

    renderClienteDetailView(clienteId);

    // THEN: Descriptive not-found text is shown
    await waitFor(() => {
      expect(
        screen.getByText(/el cliente solicitado no existe o fue eliminado/i)
      ).toBeInTheDocument();
    });
  });

  it('should NOT show the "Reintentar" button on 404 (not an ephemeral error)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render, returning 404
    const clienteId = '99999999-9999-9999-9999-999999999999';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json({ status: 404 }, { status: 404 })
      )
    );

    renderClienteDetailView(clienteId);

    // THEN: No "Reintentar" button (404 is not a transient error)
    await waitFor(() => {
      expect(screen.getByTestId('not-found-panel')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });
});
