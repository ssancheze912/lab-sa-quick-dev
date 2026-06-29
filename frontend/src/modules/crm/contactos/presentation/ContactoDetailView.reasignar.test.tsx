/**
 * Component tests — ContactoDetailView: Reassign Client (Reasignar)
 * Story 4.6 — Reassign Contact to Different Client (ATDD RED phase)
 *
 * These tests are in RED phase — the "Reasignar cliente" button and
 * ReasignarClienteDialog integration do not exist yet in ContactoDetailView.tsx.
 *
 * Acceptance Criteria covered:
 *   AC #1  Contact with non-null clienteId → "Reasignar cliente" button is visible
 *   AC #3  Clicking "Reasignar cliente" opens the dialog and triggers PUT
 *   AC #5  After successful reassignment, ClienteAsociadoSeccion shows new client name
 *   AC #6  No API call made if user cancels — client association unchanged
 *   AC #10 Contact with null clienteId → "Reasignar cliente" button is NOT shown
 *   AC #11 "Reasignar cliente" button is keyboard-accessible (<button> element)
 *
 * Test IDs:
 *   TC-1  "Reasignar cliente" button visible when contact has non-null clienteId (AC #1)
 *   TC-2  "Reasignar cliente" button NOT rendered when contact has null clienteId (AC #10)
 *   TC-3  Clicking "Reasignar cliente" opens ReasignarClienteDialog (AC #3)
 *   TC-4  After successful reassignment, new client name appears in ClienteAsociadoSeccion (AC #5)
 *   TC-5  Cancelling dialog leaves client association unchanged (AC #6)
 *   TC-6  "Reasignar cliente" button is a native <button> element (AC #11)
 *
 * Stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  createContacto,
  resetContactoCounter,
} from '../../../../test/factories/contacto.factory';
import {
  createCliente,
  resetClienteCounter,
} from '../../../../test/factories/cliente.factory';
import {
  handleGetContactoWithExistingCliente,
  handleGetClientesForSelector,
  handleReasignarClienteSuccess,
} from '../../../../test/msw/handlers/contactos-reasignar-cliente.handlers';
import { handleGetContactoWithNullClienteId } from '../../../../test/msw/handlers/contactos-cliente-asociado.handlers';
import { handleGetClienteByIdSuccess } from '../../../../test/msw/handlers/clientes-detail.handlers';
import { ContactoDetailView } from './ContactoDetailView';

// ---------------------------------------------------------------------------
// Router mock
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      to,
      params,
      children,
      className,
      ...rest
    }: {
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
      return (
        <a href={href} className={className} {...rest}>
          {children}
        </a>
      );
    },
    useNavigate: () => vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// MSW server setup
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
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: render ContactoDetailView with required providers
// ---------------------------------------------------------------------------

function renderContactoDetailView(contactoId: string) {
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
        <ContactoDetailView contactoId={contactoId} />
      </QueryClientProvider>
    ),
  };
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const CURRENT_CLIENTE = createCliente({ nombre: 'Cliente Original SA' });
const NEW_CLIENTE = createCliente({ nombre: 'Nuevo Cliente Ltda' });
const CONTACTO_WITH_CLIENTE = createContacto({ clienteId: CURRENT_CLIENTE.id });
const CONTACTO_NO_CLIENTE = createContacto({ clienteId: null });

// ---------------------------------------------------------------------------
// TC-1: "Reasignar cliente" button visible when contacto has non-null clienteId (AC #1)
// ---------------------------------------------------------------------------

describe('ContactoDetailView — TC-1: "Reasignar cliente" button visible when clienteId is set', () => {
  it('TC-1: should render [data-testid="reasignar-cliente-btn"] when contacto.clienteId is non-null', async () => {
    // GIVEN: A contacto associated with a client
    server.use(
      handleGetContactoWithExistingCliente(CONTACTO_WITH_CLIENTE, CURRENT_CLIENTE.id),
      handleGetClienteByIdSuccess(CURRENT_CLIENTE),
      handleGetClientesForSelector([CURRENT_CLIENTE, NEW_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO_WITH_CLIENTE)
    );

    // WHEN: ContactoDetailView renders
    renderContactoDetailView(CONTACTO_WITH_CLIENTE.id);

    // THEN: The "Reasignar cliente" button is visible
    await waitFor(() => {
      expect(screen.getByTestId('reasignar-cliente-btn')).toBeInTheDocument();
    });
  });

  it('TC-1: should render "Reasignar cliente" text in the button', async () => {
    // GIVEN: A contacto with an existing client association
    server.use(
      handleGetContactoWithExistingCliente(CONTACTO_WITH_CLIENTE, CURRENT_CLIENTE.id),
      handleGetClienteByIdSuccess(CURRENT_CLIENTE),
      handleGetClientesForSelector([CURRENT_CLIENTE, NEW_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO_WITH_CLIENTE)
    );

    // WHEN: Rendered
    renderContactoDetailView(CONTACTO_WITH_CLIENTE.id);

    // THEN: The button text is "Reasignar cliente"
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Reasignar cliente/i })
      ).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-2: "Reasignar cliente" button NOT shown when clienteId is null (AC #10)
// ---------------------------------------------------------------------------

describe('ContactoDetailView — TC-2: "Reasignar cliente" button NOT shown when clienteId is null', () => {
  it('TC-2: should NOT render [data-testid="reasignar-cliente-btn"] when contacto.clienteId is null', async () => {
    // GIVEN: A contacto with no client association
    server.use(handleGetContactoWithNullClienteId(CONTACTO_NO_CLIENTE));

    // WHEN: ContactoDetailView renders
    renderContactoDetailView(CONTACTO_NO_CLIENTE.id);

    // THEN: Wait for render to complete (no-client state is visible)
    await waitFor(() => {
      expect(screen.getByText('Sin cliente asignado')).toBeInTheDocument();
    });

    // THEN: The reassign button is not present
    expect(screen.queryByTestId('reasignar-cliente-btn')).not.toBeInTheDocument();
  });

  it('TC-2: should NOT render a "Reasignar cliente" button by role when clienteId is null', async () => {
    // GIVEN: Contacto without client
    server.use(handleGetContactoWithNullClienteId(CONTACTO_NO_CLIENTE));

    // WHEN: Rendered
    renderContactoDetailView(CONTACTO_NO_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByText('Sin cliente asignado')).toBeInTheDocument();
    });

    // THEN: No "Reasignar" button is accessible via role
    expect(screen.queryByRole('button', { name: /Reasignar cliente/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-3: Clicking "Reasignar cliente" opens ReasignarClienteDialog (AC #3)
// ---------------------------------------------------------------------------

describe('ContactoDetailView — TC-3: clicking button opens dialog', () => {
  it('TC-3: should render [data-testid="reasignar-cliente-dialog"] after clicking the button', async () => {
    // GIVEN: Contacto has a client; clients list available for dialog
    server.use(
      handleGetContactoWithExistingCliente(CONTACTO_WITH_CLIENTE, CURRENT_CLIENTE.id),
      handleGetClienteByIdSuccess(CURRENT_CLIENTE),
      handleGetClientesForSelector([CURRENT_CLIENTE, NEW_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO_WITH_CLIENTE)
    );

    // WHEN: ContactoDetailView renders and user clicks "Reasignar cliente"
    renderContactoDetailView(CONTACTO_WITH_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('reasignar-cliente-btn')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('reasignar-cliente-btn'));

    // THEN: ReasignarClienteDialog is now open/visible
    await waitFor(() => {
      expect(screen.getByTestId('reasignar-cliente-dialog')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-4: After successful reassignment, new client name appears (AC #5)
// ---------------------------------------------------------------------------

describe('ContactoDetailView — TC-4: new client name shown after successful reassignment', () => {
  it('TC-4: should show the new client name in ClienteAsociadoSeccion after reassignment', async () => {
    // GIVEN: Contacto is associated with CURRENT_CLIENTE; PUT will succeed and return NEW_CLIENTE
    server.use(
      handleGetContactoWithExistingCliente(CONTACTO_WITH_CLIENTE, CURRENT_CLIENTE.id),
      handleGetClienteByIdSuccess(CURRENT_CLIENTE),
      handleGetClientesForSelector([CURRENT_CLIENTE, NEW_CLIENTE]),
      // After reassignment, PUT returns contact with new clienteId
      http.put('/api/v1/contactos/:id/cliente', () =>
        HttpResponse.json(
          { ...CONTACTO_WITH_CLIENTE, clienteId: NEW_CLIENTE.id },
          { status: 200 }
        )
      )
    );

    const { queryClient } = renderContactoDetailView(CONTACTO_WITH_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('reasignar-cliente-btn')).toBeInTheDocument();
    });

    // WHEN: User opens dialog, selects new client, and confirms
    await userEvent.click(screen.getByTestId('reasignar-cliente-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('reasignar-cliente-dialog')).toBeInTheDocument();
    });

    // Simulate new client list in the updated detail fetch
    server.use(
      handleGetContactoWithExistingCliente(CONTACTO_WITH_CLIENTE, NEW_CLIENTE.id),
      handleGetClienteByIdSuccess(NEW_CLIENTE)
    );

    await userEvent.click(screen.getByText('Nuevo Cliente Ltda'));
    await userEvent.click(screen.getByRole('button', { name: /^Reasignar$/i }));

    // THEN: The new client name eventually appears in the contact detail
    await waitFor(
      () => {
        expect(screen.getByText('Nuevo Cliente Ltda')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});

// ---------------------------------------------------------------------------
// TC-5: Cancel leaves association unchanged (AC #6)
// ---------------------------------------------------------------------------

describe('ContactoDetailView — TC-5: cancel leaves client association unchanged', () => {
  it('TC-5: should still show original client name after user cancels the dialog', async () => {
    // GIVEN: Contacto associated with CURRENT_CLIENTE; dialog opened
    server.use(
      handleGetContactoWithExistingCliente(CONTACTO_WITH_CLIENTE, CURRENT_CLIENTE.id),
      handleGetClienteByIdSuccess(CURRENT_CLIENTE),
      handleGetClientesForSelector([CURRENT_CLIENTE, NEW_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO_WITH_CLIENTE)
    );

    renderContactoDetailView(CONTACTO_WITH_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByText('Cliente Original SA')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('reasignar-cliente-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('reasignar-cliente-dialog')).toBeInTheDocument();
    });

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    // THEN: Dialog closes and original client name is still shown
    await waitFor(() => {
      expect(screen.queryByTestId('reasignar-cliente-dialog')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Cliente Original SA')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-6: "Reasignar cliente" button is keyboard-accessible (AC #11)
// ---------------------------------------------------------------------------

describe('ContactoDetailView — TC-6: "Reasignar cliente" button is keyboard-accessible', () => {
  it('TC-6: should render "Reasignar cliente" as a native <button> element', async () => {
    // GIVEN: Contacto with a client association
    server.use(
      handleGetContactoWithExistingCliente(CONTACTO_WITH_CLIENTE, CURRENT_CLIENTE.id),
      handleGetClienteByIdSuccess(CURRENT_CLIENTE),
      handleGetClientesForSelector([CURRENT_CLIENTE, NEW_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO_WITH_CLIENTE)
    );

    // WHEN: Rendered
    renderContactoDetailView(CONTACTO_WITH_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('reasignar-cliente-btn')).toBeInTheDocument();
    });

    // THEN: The element is a native <button> (focusable via Tab, activatable via Enter/Space)
    const btn = screen.getByTestId('reasignar-cliente-btn');
    expect(btn.tagName.toLowerCase()).toBe('button');
  });

  it('TC-6: "Reasignar cliente" button is accessible via role=button', async () => {
    // GIVEN: Contacto with client
    server.use(
      handleGetContactoWithExistingCliente(CONTACTO_WITH_CLIENTE, CURRENT_CLIENTE.id),
      handleGetClienteByIdSuccess(CURRENT_CLIENTE),
      handleGetClientesForSelector([CURRENT_CLIENTE, NEW_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO_WITH_CLIENTE)
    );

    // WHEN: Rendered
    renderContactoDetailView(CONTACTO_WITH_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reasignar cliente/i })).toBeInTheDocument();
    });

    // THEN: The button is discoverable via ARIA role=button and its label
    const btn = screen.getByRole('button', { name: /Reasignar cliente/i });
    expect(btn).toBeInTheDocument();
  });
});
