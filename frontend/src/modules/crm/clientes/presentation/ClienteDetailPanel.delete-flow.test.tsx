/**
 * Story 2.5: ClienteDetailPanel — Delete Flow Component Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: "Eliminar" button visible on load; opens AlertDialog with correct title and actions
 * - AC2: Confirming deletion (204) → navigate to /clientes + success toast
 * - AC3: Clicking "Cancelar" → dialog closes, no API call, client unchanged
 * - AC4: Client with contacts → special toast with contacts message
 * - AC5: 5xx error → toast error, dialog closes, client detail remains
 *
 * Framework: Vitest + React Testing Library + MSW (matching Story 2.4 patterns)
 * Note: axe accessibility check skipped — @axe-core/react not installed
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// SUT — will fail until ClienteDetailPanel is extended with delete functionality
import { ClienteDetailPanel } from './ClienteDetailPanel';

// Mock siesa-ui-kit toast
vi.mock('siesa-ui-kit', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock @tanstack/react-router useNavigate
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000/api/v1/clientes';
const API_CONTACTOS = 'http://localhost:5000/api/v1/contactos';
const KNOWN_ID = '550e8400-e29b-41d4-a716-446655440005';

function buildClienteDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: KNOWN_ID,
    nombre: 'Empresa Ejemplo S.A.',
    nit: '900123456-7',
    telefono: '6011234567',
    ciudad: 'Bogotá',
    createdAt: '2026-03-12T10:30:00Z',
    updatedAt: '2026-03-12T10:30:00Z',
    ...overrides,
  };
}

const server = setupServer(
  http.get(`${API_BASE}/:id`, () => HttpResponse.json(buildClienteDetail())),
  http.delete(`${API_BASE}/:id`, () => new HttpResponse(null, { status: 204 })),
  http.put(`${API_BASE}/:id`, () => HttpResponse.json(buildClienteDetail())),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

// ─── AC1: "Eliminar" button visibility and dialog trigger ────────────────────

describe('AC1 — Botón "Eliminar" y apertura del diálogo de confirmación', () => {
  it('should render "Eliminar" button when client data is loaded', async () => {
    // GIVEN: API returns client data
    // WHEN: ClienteDetailPanel is rendered with a valid clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: "Eliminar" button is visible after data loads
    await waitFor(() => {
      expect(screen.getByTestId('cliente-eliminar-button')).toBeInTheDocument();
    });
  });

  it('should NOT render "Eliminar" button during skeleton loading state', async () => {
    // GIVEN: API is slow
    server.use(
      http.get(`${API_BASE}/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return HttpResponse.json(buildClienteDetail());
      }),
    );

    // WHEN: ClienteDetailPanel is rendered and still loading
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument();
    });

    // THEN: "Eliminar" button is NOT present during loading
    expect(screen.queryByTestId('cliente-eliminar-button')).not.toBeInTheDocument();
  });

  it('should NOT render "Eliminar" button while isEditing is true', async () => {
    // GIVEN: Client detail is loaded
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User activates edit mode
    await user.click(screen.getByTestId('cliente-editar-button'));

    // THEN: "Eliminar" button is NOT visible while editing
    expect(screen.queryByTestId('cliente-eliminar-button')).not.toBeInTheDocument();
  });

  it('should open the confirmation dialog when "Eliminar" is clicked', async () => {
    // GIVEN: Client data is loaded
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User clicks "Eliminar"
    await user.click(screen.getByTestId('cliente-eliminar-button'));

    // THEN: Confirmation dialog is displayed
    await waitFor(() => {
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
    });
  });

  it('should display "¿Eliminar este cliente?" as the dialog title', async () => {
    // GIVEN: Client data is loaded
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User clicks "Eliminar"
    await user.click(screen.getByTestId('cliente-eliminar-button'));

    // THEN: Dialog title is "¿Eliminar este cliente?"
    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog-title')).toHaveTextContent('¿Eliminar este cliente?');
    });
  });

  it('should display "Confirmar" button in the dialog', async () => {
    // GIVEN: Client data is loaded
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User opens the dialog
    await user.click(screen.getByTestId('cliente-eliminar-button'));

    // THEN: "Confirmar" action button is present
    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog-confirm')).toBeInTheDocument();
    });
  });

  it('should display "Cancelar" button in the dialog', async () => {
    // GIVEN: Client data is loaded
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User opens the dialog
    await user.click(screen.getByTestId('cliente-eliminar-button'));

    // THEN: "Cancelar" cancel button is present
    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog-cancel')).toBeInTheDocument();
    });
  });
});

// ─── AC2: Successful deletion → navigate + toast (no contacts) ───────────────

describe('AC2 — Eliminación exitosa sin contactos asociados', () => {
  it('should call navigate to /clientes after successful deletion', async () => {
    // GIVEN: DELETE returns 204; no contacts in cache
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User confirms deletion
    await user.click(screen.getByTestId('cliente-eliminar-button'));
    await user.click(screen.getByTestId('delete-dialog-confirm'));

    // THEN: navigate is called to clear clienteId from URL
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/clientes' });
    });
  });

  it('should show standard success toast "Cliente eliminado correctamente" when no contacts (AC2)', async () => {
    // GIVEN: DELETE returns 204; no contacts in cache
    const { toast } = await import('siesa-ui-kit');
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User confirms deletion
    await user.click(screen.getByTestId('cliente-eliminar-button'));
    await user.click(screen.getByTestId('delete-dialog-confirm'));

    // THEN: Standard success toast is shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Cliente eliminado correctamente');
    });
  });
});

// ─── AC3: "Cancelar" closes dialog without API call ──────────────────────────

describe('AC3 — "Cancelar" cierra diálogo sin enviar petición', () => {
  it('should close the dialog when "Cancelar" is clicked', async () => {
    // GIVEN: Confirmation dialog is open
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());
    await user.click(screen.getByTestId('cliente-eliminar-button'));
    await waitFor(() => expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument());

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByTestId('delete-dialog-cancel'));

    // THEN: Dialog is no longer visible
    await waitFor(() => {
      expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
    });
  });

  it('should NOT call DELETE API when "Cancelar" is clicked', async () => {
    // GIVEN: DELETE route is intercepted to detect unwanted calls
    let deleteCallCount = 0;
    server.use(
      http.delete(`${API_BASE}/:id`, () => {
        deleteCallCount++;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User opens dialog and clicks "Cancelar"
    await user.click(screen.getByTestId('cliente-eliminar-button'));
    await waitFor(() => expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument());
    await user.click(screen.getByTestId('delete-dialog-cancel'));

    // THEN: No DELETE request was sent to the backend
    expect(deleteCallCount).toBe(0);
  });

  it('should keep client detail content visible after clicking "Cancelar"', async () => {
    // GIVEN: Dialog is opened
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());
    await user.click(screen.getByTestId('cliente-eliminar-button'));

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByTestId('delete-dialog-cancel'));

    // THEN: Client detail content is still visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });
  });

  it('should NOT call navigate when "Cancelar" is clicked', async () => {
    // GIVEN: Dialog is opened
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());
    await user.click(screen.getByTestId('cliente-eliminar-button'));

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByTestId('delete-dialog-cancel'));

    // THEN: navigate was NOT called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ─── AC4: Client with contacts → special toast message ───────────────────────

describe('AC4 — Eliminación de cliente con contactos asociados (toast especial)', () => {
  it('should show the contacts toast when deleted client had associated contacts in cache', async () => {
    // GIVEN: Contacts query is pre-populated for this clienteId
    const { toast } = await import('siesa-ui-kit');

    // Simulate contacts in cache by pre-seeding MSW for the contactos endpoint
    server.use(
      http.get(`${API_CONTACTOS}`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === KNOWN_ID) {
          return HttpResponse.json([
            { id: 'c1', nombre: 'Juan García', clienteId: KNOWN_ID },
          ]);
        }
        return HttpResponse.json([]);
      }),
    );

    const user = userEvent.setup();

    // Pre-load the contactos for this client into the QueryClient before rendering
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    // Seed the cache directly with contact data for this client
    queryClient.setQueryData(['contactos', { clienteId: KNOWN_ID }], [
      { id: 'c1', nombre: 'Juan García', clienteId: KNOWN_ID },
    ]);

    render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }),
      ),
    );
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User confirms deletion of client that has contacts
    await user.click(screen.getByTestId('cliente-eliminar-button'));
    await user.click(screen.getByTestId('delete-dialog-confirm'));

    // THEN: Special contacts toast is shown (instead of standard message)
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.',
      );
    });
  });
});

// ─── AC5: 5xx error → toast error + dialog closes + detail remains ────────────

describe('AC5 — Error de backend al eliminar: toast error, dialog cierra, detalle visible', () => {
  it('should show toast error "No se pudo eliminar el cliente. Intenta de nuevo." on 5xx (AC5)', async () => {
    // GIVEN: DELETE returns 500
    server.use(
      http.delete(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { title: 'Internal Server Error', status: 500 },
          { status: 500 },
        ),
      ),
    );
    const { toast } = await import('siesa-ui-kit');
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User confirms deletion and backend returns 500
    await user.click(screen.getByTestId('cliente-eliminar-button'));
    await user.click(screen.getByTestId('delete-dialog-confirm'));

    // THEN: Error toast is shown with the correct message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'No se pudo eliminar el cliente. Intenta de nuevo.',
      );
    });
  });

  it('should close the dialog after a 5xx error', async () => {
    // GIVEN: DELETE returns 500
    server.use(
      http.delete(`${API_BASE}/:id`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User confirms deletion and backend fails
    await user.click(screen.getByTestId('cliente-eliminar-button'));
    await user.click(screen.getByTestId('delete-dialog-confirm'));

    // THEN: Dialog is closed after the error
    await waitFor(() => {
      expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
    });
  });

  it('should keep client detail content visible after a 5xx error', async () => {
    // GIVEN: DELETE returns 500
    server.use(
      http.delete(`${API_BASE}/:id`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User confirms deletion and backend fails
    await user.click(screen.getByTestId('cliente-eliminar-button'));
    await user.click(screen.getByTestId('delete-dialog-confirm'));

    // THEN: Client detail content is still visible (not navigated away)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });
  });

  it('should NOT call navigate when deletion fails with 5xx', async () => {
    // GIVEN: DELETE returns 500
    server.use(
      http.delete(`${API_BASE}/:id`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());

    // WHEN: User confirms deletion and backend fails
    await user.click(screen.getByTestId('cliente-eliminar-button'));
    await user.click(screen.getByTestId('delete-dialog-confirm'));

    // THEN: Navigate was NOT called (stay on client detail)
    await waitFor(() =>
      expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument(),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
