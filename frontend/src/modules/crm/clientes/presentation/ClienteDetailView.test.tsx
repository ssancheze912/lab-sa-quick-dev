/**
 * Component Tests — ClienteDetailView (Story 2.2)
 *
 * Acceptance Criteria covered:
 *   AC-1: right panel shows complete client details when client is selected
 *   AC-2: correct client details loaded from API by id
 *   AC-3: not-found message displayed when API returns 404
 *
 * Test matrix (test-design-epic-2.md — Story 2.2):
 *   C-01 — Renders skeleton while loading
 *   C-02 — Renders all four fields when API returns valid ClienteDto
 *   C-03 — Renders "Cliente no encontrado." when API returns 404
 *   C-04 — Renders ErrorPanel with "Reintentar" for non-404 MSW 500 error
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test/mocks/server';
import { clienteFactory } from '../../../../test/factories/cliente.factory';
import { ClienteDetailView } from './ClienteDetailView';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

const TEST_ID = '00000000-0000-0000-0000-000000000099';

describe('ClienteDetailView', () => {
  it('C-01: renders skeleton while loading (delayed MSW response)', async () => {
    server.use(
      http.get('/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(clienteFactory());
      }),
    );

    renderWithQuery(<ClienteDetailView clienteId={TEST_ID} />);

    // While loading, the detail panel should be present but fields should not yet appear
    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    expect(screen.queryByText('NIT/RUC')).not.toBeInTheDocument();
  });

  it('C-02: renders all four fields when API returns valid ClienteDto', async () => {
    const mockCliente = clienteFactory({
      id: TEST_ID,
      nombre: 'Empresa Alpha SA',
      nit: '900123456',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });

    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return HttpResponse.json(mockCliente);
      }),
    );

    renderWithQuery(<ClienteDetailView clienteId={TEST_ID} />);

    await waitFor(() =>
      expect(screen.getAllByText('Empresa Alpha SA').length).toBeGreaterThan(0),
    );

    // All four field labels must be present
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('NIT/RUC')).toBeInTheDocument();
    expect(screen.getByText('Teléfono')).toBeInTheDocument();
    expect(screen.getByText('Ciudad')).toBeInTheDocument();
    // All four field values must be present
    expect(screen.getByText('900123456')).toBeInTheDocument();
    expect(screen.getByText('3001234567')).toBeInTheDocument();
    expect(screen.getByText('Bogotá')).toBeInTheDocument();
  });

  it('C-03: renders "Cliente no encontrado." when API returns 404', async () => {
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'Cliente no encontrado.' },
          { status: 404 },
        );
      }),
    );

    renderWithQuery(<ClienteDetailView clienteId={TEST_ID} />);

    await waitFor(() =>
      expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument(),
    );
  });

  it('C-04: renders ErrorPanel with "Reintentar" for non-404 500 error', async () => {
    server.use(
      http.get('/api/v1/clientes/:id', () => {
        return HttpResponse.json(
          { status: 500, title: 'Internal Server Error' },
          { status: 500 },
        );
      }),
    );

    renderWithQuery(<ClienteDetailView clienteId={TEST_ID} />);

    await waitFor(() =>
      expect(screen.getByTestId('error-panel')).toBeInTheDocument(),
    );

    expect(screen.getByText('Reintentar')).toBeInTheDocument();
    expect(
      screen.getByText('No se pudo cargar el cliente. Intenta de nuevo.'),
    ).toBeInTheDocument();
  });
});
