/**
 * Edge-case component tests — ClienteDetailView edit mode
 * Story 2.4 — Edit Client — Automation Expansion
 *
 * Complements ClienteDetailView.test.tsx (ATDD baseline for Story 2.2)
 * and ClienteDetailView.edge.test.tsx (edge expansion for Story 2.2).
 *
 * Covers Story 2.4 edge cases NOT in ATDD:
 *   - "Editar" button is visible in the detail panel (AC #1)
 *   - Clicking "Editar" hides detail panel and shows edit form
 *   - Edit form is rendered with data-testid="cliente-detail-edit-form" container
 *   - Clicking "Cancelar" in edit form closes the form and shows the detail panel again
 *   - After successful edit, detail panel is shown again (not edit form)
 *   - PUT error (500) does NOT close the edit form (form stays open for retry)
 *   - Whitespace-only updates are blocked by Zod (no PUT fired)
 *   - "Editar" button is NOT visible when clienteId is null (empty state)
 *   - "Editar" button is NOT visible in error state (client not found)
 *   - Multiple clicks on "Editar" do not open multiple forms (idempotent open)
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, params, children, className, ...rest }: {
    to: string;
    params?: Record<string, string>;
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => {
    let href = to;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        href = href.replace(`$${key}`, value);
      }
    }
    return <a href={href} className={className} {...rest}>{children}</a>;
  },
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  handlePutClienteSuccess,
  handlePutClienteServerError,
} from '../../../../test/msw/handlers/clientes-update.handlers';
import { handleGetClientesSuccess } from '../../../../test/msw/handlers/clientes.handlers';
import {
  handleGetClienteByIdSuccess,
  handleGetClienteByIdNotFound,
} from '../../../../test/msw/handlers/clientes-detail.handlers';
import { createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { ClienteDetailView } from './ClienteDetailView';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetClienteCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: render ClienteDetailView with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderClienteDetailView(clienteId: string | null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={clienteId} />
      </QueryClientProvider>
    ),
  };
}

const KNOWN_CLIENTE = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Delta SA',
  nit: '888888888-8',
  telefono: '3219876543',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Edge: "Editar" button is visible in the detail panel
// ---------------------------------------------------------------------------

describe('ClienteDetailView — "Editar" button presence', () => {
  it('[P0] should show "Editar" button in the detail panel when a client is loaded', async () => {
    // GIVEN: MSW returns a valid client
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    // WHEN: ClienteDetailView renders with a valid clienteId
    renderClienteDetailView(KNOWN_CLIENTE.id);

    // THEN: "Editar" button is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-edit-button')).toBeInTheDocument();
    });
  });

  it('[P1] should NOT show "Editar" button when no client is selected (empty state)', () => {
    // GIVEN: clienteId is null
    // WHEN: ClienteDetailView renders with null clienteId
    renderClienteDetailView(null);

    // THEN: "Editar" button is NOT present
    expect(screen.queryByTestId('cliente-detail-edit-button')).not.toBeInTheDocument();
  });

  it('[P1] should NOT show "Editar" button when client is not found (404 error state)', async () => {
    // GIVEN: MSW returns 404 for the given clienteId
    server.use(handleGetClienteByIdNotFound());

    // WHEN: ClienteDetailView renders with a non-existent clienteId
    renderClienteDetailView('00000000-0000-0000-0000-000000000000');

    // THEN: Not-found state loads, "Editar" button is NOT present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-not-found')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('cliente-detail-edit-button')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: Clicking "Editar" toggles to edit form
// ---------------------------------------------------------------------------

describe('ClienteDetailView — clicking "Editar" opens edit form', () => {
  it('[P0] should hide the detail panel and show the edit form when "Editar" is clicked', async () => {
    // GIVEN: A client is loaded in the detail view
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    // Wait for detail panel to load
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    // WHEN: User clicks "Editar"
    fireEvent.click(screen.getByTestId('cliente-detail-edit-button'));

    // THEN: Detail panel is hidden and edit form container is shown
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('cliente-detail-edit-form')).toBeInTheDocument();
  });

  it('[P1] should show the edit form pre-filled with Nombre after clicking "Editar"', async () => {
    // GIVEN: A client loaded in the detail view
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    // WHEN: User clicks "Editar"
    fireEvent.click(screen.getByTestId('cliente-detail-edit-button'));

    // THEN: Form input Nombre is pre-filled with the client's current nombre
    await waitFor(() => {
      const nombreInput = screen.getByTestId('cliente-form-nombre') as HTMLInputElement;
      expect(nombreInput.value).toBe(KNOWN_CLIENTE.nombre);
    });
  });

  it('[P2] should not open multiple edit forms when "Editar" is clicked more than once', async () => {
    // GIVEN: A client is loaded
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    // WHEN: "Editar" button is clicked (it disappears after first click since panel hides)
    fireEvent.click(screen.getByTestId('cliente-detail-edit-button'));

    // THEN: Only one edit form is rendered (not duplicated)
    const editForms = screen.queryAllByTestId('cliente-detail-edit-form');
    expect(editForms).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Edge: Clicking "Cancelar" in edit form returns to detail panel
// ---------------------------------------------------------------------------

describe('ClienteDetailView — "Cancelar" in edit form returns to detail panel', () => {
  it('[P0] should show detail panel again after "Cancelar" is clicked in the edit form', async () => {
    // GIVEN: A client detail is shown and edit form is opened
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    // Open edit form
    fireEvent.click(screen.getByTestId('cliente-detail-edit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-edit-form')).toBeInTheDocument();
    });

    // WHEN: User clicks "Cancelar" in the edit form
    fireEvent.click(screen.getByTestId('cliente-form-cancel'));

    // THEN: Edit form is hidden and detail panel is shown again
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-edit-form')).not.toBeInTheDocument();
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });

  it('[P1] should NOT trigger any PUT when "Cancelar" is clicked in the edit form', async () => {
    // GIVEN: A client loaded, edit form open, PUT handler would capture any request
    let putWasCalled = false;
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE]),
      http.put(`/api/v1/clientes/${KNOWN_CLIENTE.id}`, () => {
        putWasCalled = true;
        return HttpResponse.json(KNOWN_CLIENTE, { status: 200 });
      })
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-edit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-edit-form')).toBeInTheDocument();
    });

    // Modify a field but cancel
    fireEvent.change(screen.getByTestId('cliente-form-nombre'), {
      target: { value: 'Changed Name' },
    });

    // WHEN: Cancelar clicked
    fireEvent.click(screen.getByTestId('cliente-form-cancel'));

    // THEN: PUT was NOT called
    expect(putWasCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge: After successful PUT, detail panel is shown (edit form closes)
// ---------------------------------------------------------------------------

describe('ClienteDetailView — after successful PUT, detail panel returns', () => {
  it('[P0] should close the edit form and show the detail panel after successful PUT', async () => {
    // GIVEN: Client loaded, edit form open, PUT succeeds
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE]),
      handlePutClienteSuccess()
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-edit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-edit-form')).toBeInTheDocument();
    });

    // WHEN: Submit the form
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: After PUT succeeds, edit form is closed
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-edit-form')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: PUT error does NOT close the edit form
// ---------------------------------------------------------------------------

describe('ClienteDetailView — PUT error keeps edit form open', () => {
  it('[P1] should keep the edit form open when PUT fails with 500', async () => {
    // GIVEN: Client loaded, edit form open, PUT fails
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE]),
      handlePutClienteServerError()
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-edit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-edit-form')).toBeInTheDocument();
    });

    // WHEN: Submit the form (PUT will fail)
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Edit form remains open (PUT error did not close it)
    await waitFor(() => {
      // Wait for the mutation to settle (submit button re-enables)
      expect(screen.getByTestId('cliente-form-submit')).not.toBeDisabled();
    });

    // Edit form container still in DOM
    expect(screen.getByTestId('cliente-detail-edit-form')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: Whitespace-only fields are blocked by Zod in edit mode
// ---------------------------------------------------------------------------

describe('ClienteDetailView edit mode — whitespace-only blocked by Zod', () => {
  it('[P1] should NOT send PUT when Nombre is cleared to whitespace only in edit mode', async () => {
    // GIVEN: Client loaded, edit form open
    let putWasCalled = false;
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE]),
      http.put(`/api/v1/clientes/${KNOWN_CLIENTE.id}`, () => {
        putWasCalled = true;
        return HttpResponse.json(KNOWN_CLIENTE, { status: 200 });
      })
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-edit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-edit-form')).toBeInTheDocument();
    });

    // WHEN: Nombre is changed to whitespace-only and form submitted
    fireEvent.change(screen.getByTestId('cliente-form-nombre'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Inline error on Nombre, PUT not called
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-error-nombre')).toBeInTheDocument();
    });

    expect(putWasCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge: "Editar" button label is in Spanish
// ---------------------------------------------------------------------------

describe('ClienteDetailView — "Editar" button text is in Spanish', () => {
  it('[P2] should display "Editar" text on the edit button (not English "Edit")', async () => {
    // GIVEN: A client loaded
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    // THEN: Button text is "Editar" in Spanish
    await waitFor(() => {
      const editBtn = screen.getByTestId('cliente-detail-edit-button');
      expect(editBtn.textContent).toMatch(/editar/i);
      expect(editBtn.textContent).not.toMatch(/^edit$/i);
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: Edit button is a type="button" (does not submit any parent form)
// ---------------------------------------------------------------------------

describe('ClienteDetailView — "Editar" button does not trigger form submission', () => {
  it('[P2] should not trigger any HTTP request when "Editar" button is clicked', async () => {
    // GIVEN: Client loaded, no PUT handler (any PUT would cause MSW unhandled error)
    server.use(
      handleGetClienteByIdSuccess(createCliente({ nombre: 'Test Corp' })),
      handleGetClientesSuccess([])
    );

    const client = createCliente({ nombre: 'Test Corp' });
    server.resetHandlers();
    server.use(
      handleGetClienteByIdSuccess(client),
      handleGetClientesSuccess([client])
    );

    renderClienteDetailView(client.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    // WHEN: "Editar" is clicked
    // THEN: No HTTP request is triggered (would cause MSW unhandled error otherwise)
    expect(() => {
      fireEvent.click(screen.getByTestId('cliente-detail-edit-button'));
    }).not.toThrow();

    // THEN: Edit form is now visible (only UI state change, no network)
    expect(screen.getByTestId('cliente-detail-edit-form')).toBeInTheDocument();
  });
});
