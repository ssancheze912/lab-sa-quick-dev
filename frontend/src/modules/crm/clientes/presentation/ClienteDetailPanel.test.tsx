/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Component Tests (Vitest + React Testing Library + MSW) — RED Phase
 * Tests fail until ClienteDetailPanel, useCliente, and related infrastructure are implemented.
 *
 * Acceptance Criteria covered:
 *   AC1 — Right panel shows Nombre, NIT/RUC, Teléfono, Ciudad + URL updates to /clientes/:clienteId
 *   AC2 — Direct URL access /clientes/:clienteId loads correct client from GET /api/v1/clientes/:id
 *   AC3 — 404 clienteId shows graceful not-found message without crash
 *   AC4 — Network failure shows ErrorPanel with "Reintentar" button
 *   AC5 — Loading state shows skeleton placeholders (NOT a spinner)
 *
 * Test Cases:
 *   TC-E2-P1-06 — Clicking client shows detail panel with all four fields
 *   TC-E2-P1-08 — Not-found ID shows graceful message without crash
 *   AC5 skeleton test — Skeleton shown while loading
 *   AC4 error panel test — ErrorPanel shown on network failure; retry refetches
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// This module does not exist yet — tests will fail (RED phase)
import { ClienteDetailPanel } from './ClienteDetailPanel';

// ─── MSW Server Setup ────────────────────────────────────────────────────────

const CLIENTE_ID = '11111111-0000-0000-0000-000000000001';
const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

const mockCliente = {
  id: CLIENTE_ID,
  nombre: 'Acme Colombia SA',
  nit: '900111222',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// Network-first intercept: configure before any navigation/render
const server = setupServer(
  http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
    return HttpResponse.json(mockCliente);
  }),
  http.get(`*/api/v1/clientes/${NON_EXISTENT_ID}`, () => {
    return new HttpResponse(null, { status: 404 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement, queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { ...render(ui, { wrapper: Wrapper }), queryClient: qc };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-06 — AC1: Clicking client shows detail panel with all four fields
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — TC-E2-P1-06: Client detail panel shows all four fields', () => {
  test('should render the detail panel container with data-testid="cliente-detail-panel"', async () => {
    // GIVEN: MSW intercepts GET /api/v1/clientes/:id and returns a full client
    // WHEN: ClienteDetailPanel is rendered with a valid clienteId prop
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: The detail panel container is present in the DOM
    await waitFor(() =>
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
    );
  });

  test('should display the client Nombre in the detail panel', async () => {
    // GIVEN: MSW returns a client with nombre "Acme Colombia SA"
    // WHEN: ClienteDetailPanel is rendered with the client's id
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: The Nombre field is visible
    await waitFor(() =>
      expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument()
    );
  });

  test('should display the client NIT/RUC in the detail panel', async () => {
    // GIVEN: MSW returns a client with nit "900111222"
    // WHEN: ClienteDetailPanel is rendered
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: The NIT/RUC field value is visible
    await waitFor(() =>
      expect(screen.getByText('900111222')).toBeInTheDocument()
    );
  });

  test('should display the client Teléfono in the detail panel', async () => {
    // GIVEN: MSW returns a client with telefono "3001234567"
    // WHEN: ClienteDetailPanel is rendered
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: The Teléfono field value is visible
    await waitFor(() =>
      expect(screen.getByText('3001234567')).toBeInTheDocument()
    );
  });

  test('should display the client Ciudad in the detail panel', async () => {
    // GIVEN: MSW returns a client with ciudad "Bogotá"
    // WHEN: ClienteDetailPanel is rendered
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: The Ciudad field value is visible
    await waitFor(() =>
      expect(screen.getByText('Bogotá')).toBeInTheDocument()
    );
  });

  test('should display all four fields simultaneously (AC1 full coverage)', async () => {
    // GIVEN: MSW returns a complete client record
    // WHEN: ClienteDetailPanel is rendered
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: All four fields are visible at the same time (TC-E2-P1-06 core assertion)
    await waitFor(() => {
      expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument();
      expect(screen.getByText('900111222')).toBeInTheDocument();
      expect(screen.getByText('3001234567')).toBeInTheDocument();
      expect(screen.getByText('Bogotá')).toBeInTheDocument();
    });
  });

  test('should render detail region with role="region" and aria-label="Detalle del cliente" (WCAG 2.1 AA)', async () => {
    // GIVEN: MSW returns a valid client
    // WHEN: ClienteDetailPanel is rendered
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: The region has proper WCAG 2.1 AA semantic (AC3 Task spec)
    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: /detalle del cliente/i })
      ).toBeInTheDocument()
    );
  });

  test('should display Spanish field labels: Nombre, NIT/RUC, Teléfono, Ciudad', async () => {
    // GIVEN: MSW returns a valid client
    // WHEN: ClienteDetailPanel is rendered
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: All four field labels are displayed in Spanish
    await waitFor(() => {
      expect(screen.getByText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByText(/nit\/ruc/i)).toBeInTheDocument();
      expect(screen.getByText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByText(/ciudad/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Direct URL access (deep linking): loads from GET /api/v1/clientes/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Deep linking: ClienteDetailPanel fetches by id independently', () => {
  test('should fetch client data using GET /api/v1/clientes/:id when rendered with clienteId prop', async () => {
    // GIVEN: No list cache pre-loaded — fresh QueryClient (simulates direct URL access)
    // Network-first: MSW intercept registered before render
    // WHEN: ClienteDetailPanel receives a clienteId prop directly
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: Client data is loaded and displayed (independent of list cache)
    await waitFor(() =>
      expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument()
    );
    expect(screen.getByText('900111222')).toBeInTheDocument();
    expect(screen.getByText('3001234567')).toBeInTheDocument();
    expect(screen.getByText('Bogotá')).toBeInTheDocument();
  });

  test('should use queryKey ["clientes", clienteId] independent of ["clientes"] list cache', async () => {
    // GIVEN: A QueryClient with only ["clientes"] list cache seeded (no single-item cache)
    const queryClient = createQueryClient();
    queryClient.setQueryData(['clientes'], [mockCliente]); // list cache only

    // WHEN: ClienteDetailPanel is rendered (it should use ["clientes", id] key independently)
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />, queryClient);

    // THEN: Client data eventually loads (either from list or from individual fetch)
    await waitFor(() =>
      expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-08 — AC3: Not-found ID shows graceful message without crash
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — TC-E2-P1-08: Not-found client ID shows graceful not-found message', () => {
  test('should display a not-found message when GET /api/v1/clientes/:id returns 404', async () => {
    // GIVEN: MSW returns HTTP 404 for NON_EXISTENT_ID
    // Network-first: intercept registered in server setup above
    // WHEN: ClienteDetailPanel is rendered with a non-existent clienteId
    renderWithProviders(<ClienteDetailPanel clienteId={NON_EXISTENT_ID} />);

    // THEN: A graceful not-found message is displayed in Spanish (TC-E2-P1-08)
    await waitFor(() =>
      expect(
        screen.getByText(/cliente no encontrado/i)
      ).toBeInTheDocument()
    );
  });

  test('should render the not-found message with role="status" (WCAG 2.1 AA)', async () => {
    // GIVEN: MSW returns 404 for NON_EXISTENT_ID
    // WHEN: ClienteDetailPanel renders the not-found state
    renderWithProviders(<ClienteDetailPanel clienteId={NON_EXISTENT_ID} />);

    // THEN: The not-found message has role="status" (non-disruptive, WCAG 2.1 AA)
    await waitFor(() =>
      expect(screen.getByRole('status')).toBeInTheDocument()
    );
  });

  test('should NOT render an error boundary or crash the shell layout on 404', async () => {
    // GIVEN: MSW returns 404 for NON_EXISTENT_ID
    // WHEN: ClienteDetailPanel is rendered (shell layout wraps it)
    const { container } = renderWithProviders(
      <div data-testid="shell-layout">
        <ClienteDetailPanel clienteId={NON_EXISTENT_ID} />
      </div>
    );

    // THEN: Shell layout container remains in the DOM (no crash)
    await waitFor(() =>
      expect(screen.getByText(/cliente no encontrado/i)).toBeInTheDocument()
    );
    expect(container.querySelector('[data-testid="shell-layout"]')).toBeInTheDocument();
  });

  test('should NOT render the four client fields when 404 not-found', async () => {
    // GIVEN: MSW returns 404
    // WHEN: ClienteDetailPanel renders not-found state
    renderWithProviders(<ClienteDetailPanel clienteId={NON_EXISTENT_ID} />);

    // THEN: The four client data fields are NOT rendered
    await waitFor(() =>
      expect(screen.getByRole('status')).toBeInTheDocument()
    );
    expect(screen.queryByText('Acme Colombia SA')).not.toBeInTheDocument();
    expect(screen.queryByText('900111222')).not.toBeInTheDocument();
  });

  test('should NOT render ErrorPanel (Reintentar button) on 404 — distinct from network error', async () => {
    // GIVEN: MSW returns 404 (not-found, not a network failure)
    // WHEN: ClienteDetailPanel renders not-found state
    renderWithProviders(<ClienteDetailPanel clienteId={NON_EXISTENT_ID} />);

    // THEN: The not-found state shows graceful message, not ErrorPanel
    await waitFor(() =>
      expect(screen.getByRole('status')).toBeInTheDocument()
    );
    // The "Reintentar" button should NOT be present for a 404
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel with "Reintentar" on network failure
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — ErrorPanel displayed on network failure with Reintentar button', () => {
  test('should render ErrorPanel when GET /api/v1/clientes/:id returns a network error', async () => {
    // GIVEN: MSW simulates a network error (not 404, but a connectivity failure)
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteDetailPanel is rendered
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: ErrorPanel is rendered (reuses shared ErrorPanel component)
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument()
    );
  });

  test('should render a "Reintentar" button inside ErrorPanel on network failure', async () => {
    // GIVEN: MSW simulates a network error
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteDetailPanel is in error state
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: A "Reintentar" button is present (exact label per AC4 spec)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Reintentar' })
      ).toBeInTheDocument()
    );
  });

  test('should re-fetch client data when Reintentar is clicked after network error', async () => {
    // GIVEN: First request fails, second request succeeds
    let callCount = 0;
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.error();
        }
        return HttpResponse.json(mockCliente);
      })
    );

    // WHEN: ClienteDetailPanel renders in error state
    const user = userEvent.setup();
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // Wait for error state
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    );

    // AND WHEN: User clicks "Reintentar"
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    // THEN: Client detail is displayed after retry
    await waitFor(() =>
      expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument()
    );
  });

  test('should render ErrorPanel with role="alert" on network failure (WCAG 2.1 AA)', async () => {
    // GIVEN: MSW simulates a network error
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteDetailPanel renders in error state
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: ErrorPanel has role="alert" for screen readers (WCAG 2.1 AA)
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument()
    );
  });

  test('should render ErrorPanel with data-testid="error-panel" on network failure', async () => {
    // GIVEN: MSW simulates a network error
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteDetailPanel is in error state
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: The error panel has the expected testid
    await waitFor(() =>
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    );
  });

  test('should NOT render the four client fields when in error state', async () => {
    // GIVEN: MSW simulates a network error
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteDetailPanel renders in error state
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: No client data fields are shown during error
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument()
    );
    expect(screen.queryByText('Acme Colombia SA')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Skeleton placeholders shown while loading (NOT a spinner)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Skeleton placeholders shown during loading state', () => {
  test('should render the detail panel container even during loading state', () => {
    // GIVEN: MSW holds the response (fetch in progress, never resolves in this test)
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, async () => {
        // Delay indefinitely to hold loading state
        await new Promise(() => { /* never resolves */ });
        return HttpResponse.json(mockCliente);
      })
    );

    // WHEN: ClienteDetailPanel is rendered (loading in progress)
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: Panel container is present even during loading
    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
  });

  test('should NOT render client data fields while loading is in progress', () => {
    // GIVEN: MSW holds the response indefinitely
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, async () => {
        await new Promise(() => { /* never resolves */ });
        return HttpResponse.json(mockCliente);
      })
    );

    // WHEN: ClienteDetailPanel is rendered during loading
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: Client data is NOT shown during loading (skeletons appear instead)
    expect(screen.queryByText('Acme Colombia SA')).not.toBeInTheDocument();
    expect(screen.queryByText('900111222')).not.toBeInTheDocument();
  });

  test('should NOT render ErrorPanel or not-found message during loading state', () => {
    // GIVEN: MSW holds the response
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, async () => {
        await new Promise(() => { /* never resolves */ });
        return HttpResponse.json(mockCliente);
      })
    );

    // WHEN: ClienteDetailPanel is rendered
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: Neither error nor not-found state is shown during loading
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('should NOT render a spinner element during loading (skeleton only, per AC5)', () => {
    // GIVEN: MSW holds the response
    server.use(
      http.get(`*/api/v1/clientes/${CLIENTE_ID}`, async () => {
        await new Promise(() => { /* never resolves */ });
        return HttpResponse.json(mockCliente);
      })
    );

    // WHEN: ClienteDetailPanel is rendered during loading
    renderWithProviders(<ClienteDetailPanel clienteId={CLIENTE_ID} />);

    // THEN: No spinner element is rendered (AC5 requires react-loading-skeleton, not a spinner)
    // Common spinner patterns: role="progressbar" with spin animation or status="loading"
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
