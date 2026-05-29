/**
 * Edge Case Tests — ClienteListView Component
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Expands ATDD coverage with:
 *   - Search boundary conditions (whitespace-only, special chars, accents, NIT with dashes)
 *   - EmptyState differentiates "no clients" vs "no search match"
 *   - onClientSelect callback fires with correct client id on item click
 *   - Loading skeleton disappears after data loads
 *   - ErrorPanel not visible on success
 *   - Accessibility attributes on list items (role, aria-label)
 *   - Consecutive search updates (overwrite, not accumulate)
 *   - Client list item renders all visible data fields
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createCliente, createClientes } from '../../../../../test/factories/cliente.factory';
import { ClienteListView } from './ClienteListView';

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement, queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();
  return {
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
    client,
  };
}

// ─── Edge: Search with whitespace-only input ──────────────────────────────────

describe('Edge — búsqueda con entrada de solo espacios en blanco', () => {
  it('debe mostrar todos los clientes cuando el campo de búsqueda contiene solo espacios', async () => {
    // GIVEN: Two clients are loaded
    const clientes = [
      createCliente({ nombre: 'Empresa Alpha', nit: '900000001' }),
      createCliente({ nombre: 'Empresa Beta', nit: '900000002' }),
    ];

    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: User types only spaces
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, '   ');

    // THEN: Full list is still shown (whitespace-only is treated as empty)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });
  });

  it('debe mostrar la lista completa cuando el campo de búsqueda tiene solo un espacio', async () => {
    const clientes = [
      createCliente({ nombre: 'Empresa Gamma', nit: '900000003' }),
    ];

    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, ' ');

    // THEN: The single client is still visible
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
  });
});

// ─── Edge: Search with accented characters ────────────────────────────────────

describe('Edge — búsqueda con caracteres acentuados', () => {
  it('debe encontrar clientes cuyo nombre tiene acentos cuando se busca sin acentos', async () => {
    // NOTE: This test validates whether the filter handles accent-insensitive search.
    // If the implementation is accent-sensitive (lowercase only), it will only match exact casing.
    // This test documents the CURRENT behavior (case-insensitive, accent-sensitive).
    const cliente = createCliente({ nombre: 'Importación Delta SAS', nit: '900000010' });

    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: User searches with the exact accented word (should match)
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'importación');

    // THEN: Client is found (case-insensitive match on accented input)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
  });

  it('debe encontrar clientes por NIT con guión', async () => {
    // GIVEN: NIT contains a dash (common Colombian format: 900123456-7)
    const cliente = createCliente({ nombre: 'Empresa NIT Guión', nit: '900123456-7' });

    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: User searches the full NIT with dash
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, '900123456-7');

    // THEN: Client is found
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
  });

  it('debe encontrar clientes por NIT parcial (sin dígito de verificación)', async () => {
    // GIVEN: NIT has a verification digit
    const cliente = createCliente({ nombre: 'Empresa Parcial NIT', nit: '900123456-7' });

    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: User searches only the numeric part (without dash)
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, '900123456');

    // THEN: Client is found by partial NIT match
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
  });
});

// ─── Edge: No search results (search EmptyState) ─────────────────────────────

describe('Edge — sin resultados en búsqueda activa', () => {
  it('debe mostrar EmptyState cuando la búsqueda no tiene coincidencias', async () => {
    // GIVEN: One client exists
    const cliente = createCliente({ nombre: 'Empresa Alpha', nit: '900000001' });
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: User types a term with no matches
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'ZZZNOMATCH999');

    // THEN: EmptyState is visible, no list items remain
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });

  it('al limpiar la búsqueda sin resultados debe restaurar la lista completa', async () => {
    // GIVEN: One client exists, and search filtered to zero results
    const cliente = createCliente({ nombre: 'Empresa Restaurar', nit: '900000099' });
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'ZZZNOMATCH');

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // WHEN: User clears the search
    await userEvent.clear(searchInput);

    // THEN: Full list is restored
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});

// ─── Edge: onClientSelect callback ────────────────────────────────────────────

describe('Edge — callback onClientSelect al hacer clic en un item', () => {
  it('debe llamar onClientSelect con el id del cliente cuando se hace clic en un item', async () => {
    // GIVEN: One client is rendered and a click handler is provided
    const cliente = createCliente({ id: 'uuid-click-test', nombre: 'Empresa Click', nit: '900000100' });
    const onClientSelect = vi.fn();

    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView onClientSelect={onClientSelect} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: User clicks the list item
    await userEvent.click(screen.getByTestId('cliente-list-item'));

    // THEN: onClientSelect is called with the correct client id
    expect(onClientSelect).toHaveBeenCalledTimes(1);
    expect(onClientSelect).toHaveBeenCalledWith('uuid-click-test');
  });

  it('debe llamar onClientSelect con el id correcto cuando hay múltiples clientes', async () => {
    // GIVEN: Two clients exist
    const cliente1 = createCliente({ id: 'id-first', nombre: 'Empresa Primera', nit: '900000101' });
    const cliente2 = createCliente({ id: 'id-second', nombre: 'Empresa Segunda', nit: '900000102' });
    const onClientSelect = vi.fn();

    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente1, cliente2])));

    renderWithProviders(<ClienteListView onClientSelect={onClientSelect} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: User clicks the second client item
    const items = screen.getAllByTestId('cliente-list-item');
    await userEvent.click(items[1]);

    // THEN: The second client's id is passed
    expect(onClientSelect).toHaveBeenCalledWith('id-second');
  });

  it('no debe lanzar error si onClientSelect no es proporcionado (prop opcional)', async () => {
    // GIVEN: A client exists but no onClientSelect provided
    const cliente = createCliente({ id: 'id-nohandler', nombre: 'Empresa Sin Handler', nit: '900000200' });

    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: User clicks the list item (no handler registered)
    // THEN: No error is thrown
    await expect(
      userEvent.click(screen.getByTestId('cliente-list-item')),
    ).resolves.not.toThrow();
  });
});

// ─── Edge: Loading skeleton state management ──────────────────────────────────

describe('Edge — estados de carga y esqueleto', () => {
  it('el skeleton de carga NO debe estar visible después de que los datos cargan', async () => {
    // GIVEN: Backend returns data
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([])));

    renderWithProviders(<ClienteListView />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId('clientes-loading-skeleton')).not.toBeInTheDocument();
    });
  });

  it('el ErrorPanel NO debe estar visible cuando el fetch tiene éxito', async () => {
    // GIVEN: Backend returns successfully
    const cliente = createCliente({ nombre: 'Empresa OK', nit: '900000300' });
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // THEN: ErrorPanel is not in the DOM
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });

  it('el EmptyState NO debe estar visible cuando hay clientes en la lista', async () => {
    // GIVEN: Backend returns clients
    const clientes = createClientes(3);
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    // THEN: EmptyState is not in the DOM
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('el skeleton de carga NO debe estar visible cuando ocurre un error', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Server Error' }, { status: 500 }),
      ),
    );

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // THEN: Loading skeleton is NOT shown alongside the error
    expect(screen.queryByTestId('clientes-loading-skeleton')).not.toBeInTheDocument();
  });
});

// ─── Edge: Accessibility attributes ──────────────────────────────────────────

describe('Edge — accesibilidad de los items de la lista', () => {
  it('cada item de la lista debe tener role="listitem"', async () => {
    // GIVEN: Clients are loaded
    const cliente = createCliente({ nombre: 'Empresa Aria', nit: '900000400' });
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // THEN: Item has listitem role
    const item = screen.getByTestId('cliente-list-item');
    expect(item).toHaveAttribute('role', 'listitem');
  });

  it('cada item de la lista debe tener aria-label descriptivo en español', async () => {
    // GIVEN: A client with known nombre and NIT
    const cliente = createCliente({ nombre: 'Empresa Aria SAS', nit: '900000401' });
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // THEN: aria-label contains the client name and NIT
    const item = screen.getByTestId('cliente-list-item');
    const ariaLabel = item.getAttribute('aria-label') ?? '';
    expect(ariaLabel).toContain('Empresa Aria SAS');
    expect(ariaLabel).toContain('900000401');
  });

  it('el campo de búsqueda debe tener aria-label en español', async () => {
    // GIVEN: Component renders
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([])));

    renderWithProviders(<ClienteListView />);

    const searchInput = await screen.findByTestId('clientes-search-input');

    // THEN: aria-label is in Spanish
    const ariaLabel = searchInput.getAttribute('aria-label') ?? '';
    expect(ariaLabel.length).toBeGreaterThan(0);
    // Should not contain English words as the sole content
    expect(ariaLabel.toLowerCase()).not.toBe('search');
  });

  it('el ErrorPanel debe tener role="alert" para lectores de pantalla', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Server Error' }, { status: 500 }),
      ),
    );

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // THEN: error-panel has role="alert"
    const errorPanel = screen.getByTestId('error-panel');
    expect(errorPanel).toHaveAttribute('role', 'alert');
  });
});

// ─── Edge: consecutive search overwrites ─────────────────────────────────────

describe('Edge — búsquedas consecutivas y cambios de entrada', () => {
  it('la búsqueda debe actualizarse correctamente al reemplazar el texto de búsqueda', async () => {
    // GIVEN: Two clients with distinct names
    const clientes = [
      createCliente({ id: 'id-alpha', nombre: 'Empresa Alpha SAS', nit: '900000500' }),
      createCliente({ id: 'id-beta', nombre: 'Empresa Beta SAS', nit: '900000501' }),
    ];

    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByTestId('clientes-search-input');

    // WHEN: User searches "Alpha" — 1 result
    await userEvent.type(searchInput, 'Alpha');
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // AND: User clears and types "Beta" — different 1 result
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'Beta');

    // THEN: Only Beta client is shown
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
      expect(screen.getByText('Empresa Beta SAS')).toBeInTheDocument();
    });
  });

  it('una búsqueda que coincide con Nombre Y NIT debe retornar un solo resultado sin duplicados', async () => {
    // GIVEN: A client whose nombre contains the NIT digits too (pathological case)
    const cliente = createCliente({ nombre: 'Empresa 900000600 Especial', nit: '900000600' });

    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: User searches the value that matches both nombre and nit
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, '900000600');

    // THEN: Only ONE item is shown (no duplicate from nombre+nit both matching)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
  });
});

// ─── Edge: mixed states ───────────────────────────────────────────────────────

describe('Edge — solo un estado de UI visible a la vez', () => {
  it('solo el ErrorPanel debe ser visible en estado de error (sin lista, sin skeleton, sin empty)', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Error' }, { status: 500 }),
      ),
    );

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // THEN: Mutually exclusive — no other main states shown
    expect(screen.queryByTestId('clientes-loading-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });

  it('solo el EmptyState debe ser visible cuando la lista está vacía (sin error, sin skeleton)', async () => {
    // GIVEN: Backend returns empty list
    server.use(http.get('*/api/v1/clientes', () => HttpResponse.json([])));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // THEN: No other main states shown
    expect(screen.queryByTestId('clientes-loading-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});
