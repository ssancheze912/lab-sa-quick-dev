import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import { ClienteListPanel } from './ClienteListPanel';
import type { Cliente } from '../domain/Cliente';

// Generate 500 mock client records for performance test
function generateMockClientes(count: number): Cliente[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    nombre: `Empresa ${i}`,
    nit: `90000${i}-${i % 10}`,
    telefono: `60100${i}`,
    ciudad: 'Bogotá',
    createdAt: new Date(2026, 0, 1).toISOString(),
    updatedAt: new Date(2026, 0, 1).toISOString(),
  }));
}

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    createElement(QueryClientProvider, { client: queryClient }, ui)
  );
}

// TC-E2-P1-05: Filter renders within 1000ms with 500 mock records
describe('ClienteListPanel — TC-E2-P1-05: filter performance with 500 records', () => {
  it('filters 500 records within 1000ms', async () => {
    const mocks = generateMockClientes(500);
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(mocks))
    );

    renderWithQuery(<ClienteListPanel />);

    // Wait for list to load
    await waitFor(() => expect(screen.getByPlaceholderText('Buscar por nombre o NIT/RUC…')).toBeInTheDocument(), {
      timeout: 2000,
    });

    const start = performance.now();
    const searchInput = screen.getByPlaceholderText('Buscar por nombre o NIT/RUC…');
    fireEvent.change(searchInput, { target: { value: 'Empresa 1' } });

    await waitFor(() => {
      // Should show items matching "Empresa 1"
      const items = screen.getAllByRole('button', { name: /Empresa 1/ });
      expect(items.length).toBeGreaterThan(0);
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});

// TC-E2-P1-06: Empty state displayed when server returns []
describe('ClienteListPanel — TC-E2-P1-06: empty state', () => {
  it('shows empty state when no clients are returned', async () => {
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([]))
    );

    renderWithQuery(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
    );
  });
});

// TC-E2-P1-07: ErrorPanel with "Reintentar" shown on 500 → retry → success
describe('ClienteListPanel — TC-E2-P1-07: error state and retry', () => {
  it('shows error panel on fetch failure and retries on button click', async () => {
    let callCount = 0;
    const mockData: Cliente[] = [
      {
        id: '1',
        nombre: 'Empresa Alpha',
        nit: '900123456-1',
        telefono: '6014567890',
        ciudad: 'Bogotá',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
        return HttpResponse.json(mockData);
      })
    );

    renderWithQuery(<ClienteListPanel />);

    // Wait for error panel
    await waitFor(() =>
      expect(screen.getByText('Error al cargar los clientes')).toBeInTheDocument()
    );

    // Click retry button
    const retryButton = screen.getByRole('button', { name: 'Reintentar' });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);

    // After retry, list should appear
    await waitFor(() =>
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
    );
  });
});
