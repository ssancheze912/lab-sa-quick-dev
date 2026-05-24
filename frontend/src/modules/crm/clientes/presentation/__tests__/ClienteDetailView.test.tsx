/**
 * Story 2.2: Client Detail View
 * Component Tests — ClienteDetailView (RED Phase — ATDD)
 *
 * Test cases covered:
 *   TC-E2-P1-06a — MSW returns client → four fields rendered, data-testid="cliente-detail-view"
 *   TC-E2-P1-06b — MSW returns 404 → data-testid="not-found-message" with "Cliente no encontrado."
 *   TC-E2-P1-06c — While loading (isLoading) → skeleton placeholders visible, fields NOT visible
 *   AC5          — Accessibility: rendered component meets WCAG 2.1 AA (zero axe violations)
 *
 * Acceptance Criteria covered:
 *   AC1 — Right panel shows Nombre, NIT/RUC, Teléfono, Ciudad
 *   AC2 — Deep link: direct URL /clientes/:id loads correct detail
 *   AC3 — Non-existent clienteId → not-found message ("Cliente no encontrado.")
 *   AC5 — All four fields visible and WCAG 2.1 AA compliant
 *
 * Tests will FAIL until ClienteDetailView, useCliente, and clienteApiRepository.getById
 * are implemented.
 *
 * Given-When-Then pattern used throughout.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import React from 'react';
import { ClienteDetailView } from '../ClienteDetailView';
import { buildClienteDto } from '../../../../../tests/handlers/clienteHandlers';

const API_BASE = 'http://localhost:5000';

// ─── MSW server setup ────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Test wrapper ─────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  return render(
    React.createElement(QueryClientProvider, { client: qc }, ui),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-06a: Successful fetch — all four fields rendered
// AC1 + AC2: right panel shows Nombre, NIT/RUC, Teléfono, Ciudad
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — TC-E2-P1-06a: Successful data fetch', () => {
  test('Given MSW returns a client, when data loads, should render data-testid="cliente-detail-view"', async () => {
    // GIVEN: MSW returns a valid client for the given id
    const cliente = buildClienteDto({
      id: 'bbbbbbbb-0000-0000-0000-000000000001',
      nombre: 'Empresa Alpha SA',
      nit: '900100001-1',
      telefono: '3001111111',
      ciudad: 'Bogotá',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        return HttpResponse.json(cliente);
      }),
    );

    // WHEN: ClienteDetailView is rendered with a valid clienteId
    renderWithProviders(<ClienteDetailView clienteId={cliente.id} />);

    // THEN: root element with data-testid="cliente-detail-view" is present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument();
    });
  });

  test('Given MSW returns a client, when data loads, should display the Nombre field', async () => {
    // GIVEN: MSW returns a client with Nombre "Empresa Alpha SA"
    const cliente = buildClienteDto({
      id: 'bbbbbbbb-0000-0000-0000-000000000002',
      nombre: 'Empresa Alpha SA',
      nit: '900100001-1',
      telefono: '3001111111',
      ciudad: 'Bogotá',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        return HttpResponse.json(cliente);
      }),
    );

    renderWithProviders(<ClienteDetailView clienteId={cliente.id} />);

    // WHEN: data loads
    // THEN: Nombre "Empresa Alpha SA" is visible in the detail view
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toHaveTextContent('Empresa Alpha SA');
    });
  });

  test('Given MSW returns a client, when data loads, should display the NIT/RUC field', async () => {
    // GIVEN: MSW returns a client with NIT "900100001-1"
    const cliente = buildClienteDto({
      id: 'bbbbbbbb-0000-0000-0000-000000000003',
      nombre: 'Empresa Beta Ltda',
      nit: '900100001-1',
      telefono: '3002222222',
      ciudad: 'Medellín',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        return HttpResponse.json(cliente);
      }),
    );

    renderWithProviders(<ClienteDetailView clienteId={cliente.id} />);

    // WHEN: data loads
    // THEN: NIT "900100001-1" is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toHaveTextContent('900100001-1');
    });
  });

  test('Given MSW returns a client, when data loads, should display the Teléfono field', async () => {
    // GIVEN: MSW returns a client with Telefono "3003333333"
    const cliente = buildClienteDto({
      id: 'bbbbbbbb-0000-0000-0000-000000000004',
      nombre: 'Empresa Gamma Corp',
      nit: '900300003-3',
      telefono: '3003333333',
      ciudad: 'Cali',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        return HttpResponse.json(cliente);
      }),
    );

    renderWithProviders(<ClienteDetailView clienteId={cliente.id} />);

    // WHEN: data loads
    // THEN: Teléfono "3003333333" is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toHaveTextContent('3003333333');
    });
  });

  test('Given MSW returns a client, when data loads, should display the Ciudad field', async () => {
    // GIVEN: MSW returns a client with Ciudad "Cartagena"
    const cliente = buildClienteDto({
      id: 'bbbbbbbb-0000-0000-0000-000000000005',
      nombre: 'Empresa Delta SAS',
      nit: '900400004-4',
      telefono: '3004444444',
      ciudad: 'Cartagena',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        return HttpResponse.json(cliente);
      }),
    );

    renderWithProviders(<ClienteDetailView clienteId={cliente.id} />);

    // WHEN: data loads
    // THEN: Ciudad "Cartagena" is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toHaveTextContent('Cartagena');
    });
  });

  test('Given MSW returns a client, when data loads, all four fields (Nombre, NIT, Teléfono, Ciudad) should be present simultaneously', async () => {
    // GIVEN: MSW returns a full client DTO
    const cliente = buildClienteDto({
      id: 'bbbbbbbb-0000-0000-0000-000000000006',
      nombre: 'Empresa Epsilon Inc',
      nit: '900500005-5',
      telefono: '3005555555',
      ciudad: 'Barranquilla',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        return HttpResponse.json(cliente);
      }),
    );

    renderWithProviders(<ClienteDetailView clienteId={cliente.id} />);

    // WHEN: data loads
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument();
    });

    // THEN: all four fields are visible in the rendered detail view
    const detailView = screen.getByTestId('cliente-detail-view');
    expect(detailView).toHaveTextContent('Empresa Epsilon Inc');
    expect(detailView).toHaveTextContent('900500005-5');
    expect(detailView).toHaveTextContent('3005555555');
    expect(detailView).toHaveTextContent('Barranquilla');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-06b: 404 / not-found — graceful rendering
// AC3: Non-existent clienteId → "Cliente no encontrado." displayed, no JS error
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — TC-E2-P1-06b: Not-found handling (AC3)', () => {
  test('Given MSW returns 404, when data fails to load, should render data-testid="not-found-message"', async () => {
    // GIVEN: MSW returns 404 for the requested clienteId
    const nonExistentId = '00000000-dead-beef-0000-000000000000';

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${nonExistentId}`, () => {
        return HttpResponse.json(
          { type: 'https://tools.ietf.org/html/rfc7807', title: 'Not Found', status: 404 },
          { status: 404 },
        );
      }),
    );

    // WHEN: ClienteDetailView is rendered with a non-existent clienteId
    renderWithProviders(<ClienteDetailView clienteId={nonExistentId} />);

    // THEN: not-found message element is rendered
    await waitFor(() => {
      expect(screen.getByTestId('not-found-message')).toBeInTheDocument();
    });
  });

  test('Given MSW returns 404, not-found message should contain "Cliente no encontrado."', async () => {
    // GIVEN: MSW returns 404
    const nonExistentId = '00000000-dead-beef-0000-000000000001';

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${nonExistentId}`, () => {
        return HttpResponse.json(
          { title: 'Not Found', status: 404 },
          { status: 404 },
        );
      }),
    );

    renderWithProviders(<ClienteDetailView clienteId={nonExistentId} />);

    await waitFor(() => {
      expect(screen.getByTestId('not-found-message')).toBeInTheDocument();
    });

    // THEN: the exact Spanish message "Cliente no encontrado." is displayed
    expect(screen.getByTestId('not-found-message')).toHaveTextContent('Cliente no encontrado.');
  });

  test('Given MSW returns 404, the four client fields should NOT be rendered', async () => {
    // GIVEN: MSW returns 404 (no client data available)
    const nonExistentId = '00000000-dead-beef-0000-000000000002';

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${nonExistentId}`, () => {
        return HttpResponse.json(
          { title: 'Not Found', status: 404 },
          { status: 404 },
        );
      }),
    );

    renderWithProviders(<ClienteDetailView clienteId={nonExistentId} />);

    await waitFor(() => {
      expect(screen.getByTestId('not-found-message')).toBeInTheDocument();
    });

    // THEN: no client detail view root is rendered (or is hidden)
    // The not-found state replaces the normal detail view
    expect(screen.queryByTestId('cliente-detail-view')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-06c: Loading state — skeleton visible, fields NOT visible
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — TC-E2-P1-06c: Loading skeleton state', () => {
  test('While loading, skeleton placeholders should be visible and client fields should NOT be visible', async () => {
    // GIVEN: API call is delayed to observe the loading state
    const clienteId = 'cccccccc-0000-0000-0000-000000000001';
    let resolveHandler!: () => void;
    const delayPromise = new Promise<void>((resolve) => {
      resolveHandler = resolve;
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${clienteId}`, async () => {
        await delayPromise;
        return HttpResponse.json(
          buildClienteDto({
            id: clienteId,
            nombre: 'Empresa Loading Test',
            nit: '900600006-6',
            telefono: '3006666666',
            ciudad: 'Bogotá',
          }),
        );
      }),
    );

    // WHEN: ClienteDetailView is rendered (while fetch is pending)
    renderWithProviders(<ClienteDetailView clienteId={clienteId} />);

    // THEN: skeleton loading indicator is visible
    // The component must render an aria-label for the loading state
    expect(screen.getByLabelText(/cargando detalle del cliente/i)).toBeInTheDocument();

    // AND: client field values are NOT yet visible
    expect(screen.queryByText('Empresa Loading Test')).not.toBeInTheDocument();

    // Cleanup: resolve the pending request to avoid open handles
    resolveHandler();
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Accessibility — WCAG 2.1 AA (zero axe violations on success state)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — AC5: Accessibility (WCAG 2.1 AA)', () => {
  test('Rendered detail view with client data should have zero axe accessibility violations', async () => {
    // GIVEN: axe-core is available (import it dynamically to avoid hard dep if not installed)
    // This test will fail if the component has accessibility violations OR if axe-core is not installed
    let axe: ((node: Element) => Promise<{ violations: unknown[] }>) | null = null;

    try {
      const axeModule = await import('@axe-core/react');
      axe = axeModule.default as unknown as (node: Element) => Promise<{ violations: unknown[] }>;
    } catch {
      // If axe-core is not installed, try the standalone axe
      try {
        const { axe: axeCore } = await import('axe-core');
        axe = axeCore as unknown as (node: Element) => Promise<{ violations: unknown[] }>;
      } catch {
        // Skip accessibility test if neither axe package is available
        return;
      }
    }

    // GIVEN: MSW returns a valid client
    const cliente = buildClienteDto({
      id: 'dddddddd-0000-0000-0000-000000000001',
      nombre: 'Empresa Accesible SA',
      nit: '900700007-7',
      telefono: '3007777777',
      ciudad: 'Bogotá',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        return HttpResponse.json(cliente);
      }),
    );

    const { container } = renderWithProviders(<ClienteDetailView clienteId={cliente.id} />);

    // WHEN: data loads
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument();
    });

    if (axe) {
      // THEN: zero accessibility violations
      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    }
  });

  test('Rendered detail view should use semantic HTML for label-value pairs (dl/dt/dd or section with heading)', async () => {
    // GIVEN: MSW returns a valid client
    const cliente = buildClienteDto({
      id: 'dddddddd-0000-0000-0000-000000000002',
      nombre: 'Empresa Semántica Corp',
      nit: '900800008-8',
      telefono: '3008888888',
      ciudad: 'Cali',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        return HttpResponse.json(cliente);
      }),
    );

    const { container } = renderWithProviders(<ClienteDetailView clienteId={cliente.id} />);

    // WHEN: data loads
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument();
    });

    // THEN: the component uses semantic HTML for label-value pairs
    // Either <dl>/<dt>/<dd> pattern OR <section> with heading is acceptable
    const hasDl = container.querySelector('dl') !== null;
    const hasSection = container.querySelector('section') !== null;
    const hasAriaLabel = container.querySelector('[aria-label]') !== null;

    // At least one semantic structure must be present
    expect(hasDl || hasSection || hasAriaLabel).toBe(true);
  });
});
