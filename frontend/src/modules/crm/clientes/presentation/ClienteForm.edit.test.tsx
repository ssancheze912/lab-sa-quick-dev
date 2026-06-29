/**
 * Component tests — ClienteForm in edit mode
 * Story 2.4 | Edit Client
 *
 * Test IDs covered (RED phase — ClienteForm edit mode not yet implemented):
 *   TC-E2-P1-07  Edit form opens pre-filled with current values of all 4 fields
 *   TC-E2-P1-08  Click Cancelar without saving → onCancel called, no PUT triggered
 *   TC-E2-P1-09  Change Ciudad, submit → PUT called with correct payload, toast shown, onSuccess called
 *   TC-E2-P2-02  Clear required field (Nombre), submit → inline error shown, PUT not called
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failure: "ClienteForm does not accept 'mode' or 'cliente' props yet"
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import React from 'react';
import {
  handlePutClienteSuccess,
} from '../../../test/msw/handlers/clientes-update.handlers';
import { handleGetClientesSuccess } from '../../../test/msw/handlers/clientes.handlers';
import { ClienteForm } from './ClienteForm';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Shared test client fixture (pre-existing record to edit)
// ---------------------------------------------------------------------------

const EXISTING_CLIENTE = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Delta SA',
  nit: '888888888-8',
  telefono: '3219876543',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Helper: render ClienteForm in edit mode with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderClienteFormEdit(props: {
  onSuccess?: () => void;
  onCancel?: () => void;
  cliente?: typeof EXISTING_CLIENTE;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  const cliente = props.cliente ?? EXISTING_CLIENTE;

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ClienteForm
          mode="edit"
          cliente={cliente}
          onSuccess={props.onSuccess}
          onCancel={props.onCancel}
        />
      </QueryClientProvider>
    ),
  };
}

// ---------------------------------------------------------------------------
// TC-E2-P1-07: Edit form opens pre-filled with all 4 current field values
// ---------------------------------------------------------------------------

describe('TC-E2-P1-07: Edit form pre-filled with current client values', () => {
  it('should render Nombre input pre-filled with the existing client nombre', () => {
    // GIVEN: ClienteForm rendered in edit mode with an existing client
    server.use(handleGetClientesSuccess([EXISTING_CLIENTE]));
    renderClienteFormEdit();

    // THEN: Nombre input has the existing client's nombre value
    const nombreInput = screen.getByTestId('cliente-form-nombre');
    expect((nombreInput as HTMLInputElement).value).toBe(EXISTING_CLIENTE.nombre);
  });

  it('should render NIT input pre-filled with the existing client nit', () => {
    // GIVEN: ClienteForm rendered in edit mode
    server.use(handleGetClientesSuccess([EXISTING_CLIENTE]));
    renderClienteFormEdit();

    // THEN: NIT input has the existing client's nit value
    const nitInput = screen.getByTestId('cliente-form-nit');
    expect((nitInput as HTMLInputElement).value).toBe(EXISTING_CLIENTE.nit);
  });

  it('should render Teléfono input pre-filled with the existing client telefono', () => {
    // GIVEN: ClienteForm rendered in edit mode
    server.use(handleGetClientesSuccess([EXISTING_CLIENTE]));
    renderClienteFormEdit();

    // THEN: Teléfono input has the existing client's telefono value
    const telefonoInput = screen.getByTestId('cliente-form-telefono');
    expect((telefonoInput as HTMLInputElement).value).toBe(EXISTING_CLIENTE.telefono);
  });

  it('should render Ciudad input pre-filled with the existing client ciudad', () => {
    // GIVEN: ClienteForm rendered in edit mode
    server.use(handleGetClientesSuccess([EXISTING_CLIENTE]));
    renderClienteFormEdit();

    // THEN: Ciudad input has the existing client's ciudad value
    const ciudadInput = screen.getByTestId('cliente-form-ciudad');
    expect((ciudadInput as HTMLInputElement).value).toBe(EXISTING_CLIENTE.ciudad);
  });

  it('should render all 4 inputs pre-filled simultaneously', () => {
    // GIVEN: ClienteForm rendered in edit mode with full existing client data
    server.use(handleGetClientesSuccess([EXISTING_CLIENTE]));
    renderClienteFormEdit();

    // THEN: All 4 inputs are present and pre-filled
    expect((screen.getByTestId('cliente-form-nombre') as HTMLInputElement).value).toBe(EXISTING_CLIENTE.nombre);
    expect((screen.getByTestId('cliente-form-nit') as HTMLInputElement).value).toBe(EXISTING_CLIENTE.nit);
    expect((screen.getByTestId('cliente-form-telefono') as HTMLInputElement).value).toBe(EXISTING_CLIENTE.telefono);
    expect((screen.getByTestId('cliente-form-ciudad') as HTMLInputElement).value).toBe(EXISTING_CLIENTE.ciudad);
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-08: Cancelar without saving — onCancel called, no PUT triggered
// ---------------------------------------------------------------------------

describe('TC-E2-P1-08: Cancel edit — onCancel called and no PUT triggered', () => {
  it('should call onCancel when the Cancelar button is clicked', () => {
    // GIVEN: ClienteForm rendered in edit mode with an onCancel callback
    server.use(handleGetClientesSuccess([EXISTING_CLIENTE]));

    const onCancelMock = vi.fn();
    renderClienteFormEdit({ onCancel: onCancelMock });

    // WHEN: User clicks Cancelar without saving
    fireEvent.click(screen.getByTestId('cliente-form-cancel'));

    // THEN: onCancel is called exactly once
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('should NOT send PUT to backend when Cancelar is clicked', async () => {
    // GIVEN: MSW would capture any PUT request
    let putWasCalled = false;
    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesSuccess([EXISTING_CLIENTE]),
      http.put(`/api/v1/clientes/${EXISTING_CLIENTE.id}`, () => {
        putWasCalled = true;
        return HttpResponse.json(EXISTING_CLIENTE, { status: 200 });
      })
    );

    const onCancelMock = vi.fn();
    renderClienteFormEdit({ onCancel: onCancelMock });

    // WHEN: User modifies Nombre but then clicks Cancelar
    fireEvent.change(screen.getByTestId('cliente-form-nombre'), {
      target: { value: 'Modified Name' },
    });
    fireEvent.click(screen.getByTestId('cliente-form-cancel'));

    // THEN: PUT was not sent and original data unchanged
    expect(putWasCalled).toBe(false);
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-09: Change Ciudad, submit → PUT with correct payload, toast + onSuccess
// ---------------------------------------------------------------------------

describe('TC-E2-P1-09: Successful edit — PUT called with correct payload', () => {
  it('should send PUT to /api/v1/clientes/:id with updated ciudad in the request body', async () => {
    // GIVEN: PUT /api/v1/clientes/:id returns 200 with updated client
    let capturedBody: Record<string, string> | null = null;
    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesSuccess([EXISTING_CLIENTE]),
      http.put(`/api/v1/clientes/${EXISTING_CLIENTE.id}`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, string>;
        return HttpResponse.json(
          { ...EXISTING_CLIENTE, ciudad: 'Cali', updatedAt: '2026-06-29T10:00:00Z' },
          { status: 200 }
        );
      })
    );

    // WHEN: Edit form is rendered pre-filled, Ciudad is changed to "Cali", and Guardar is clicked
    renderClienteFormEdit();

    fireEvent.change(screen.getByTestId('cliente-form-ciudad'), {
      target: { value: 'Cali' },
    });

    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: PUT body contains all 4 fields with the updated ciudad
    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });

    expect(capturedBody!.nombre).toBe(EXISTING_CLIENTE.nombre);
    expect(capturedBody!.nit).toBe(EXISTING_CLIENTE.nit);
    expect(capturedBody!.telefono).toBe(EXISTING_CLIENTE.telefono);
    expect(capturedBody!.ciudad).toBe('Cali');
  });

  it('should call onSuccess after successful PUT mutation', async () => {
    // GIVEN: PUT /api/v1/clientes/:id returns 200
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([EXISTING_CLIENTE])
    );

    const onSuccessMock = vi.fn();

    // WHEN: Form is submitted with valid data
    renderClienteFormEdit({ onSuccess: onSuccessMock });

    fireEvent.change(screen.getByTestId('cliente-form-ciudad'), {
      target: { value: 'Cali' },
    });
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: onSuccess is called once
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should show success toast "Cliente actualizado correctamente" after successful PUT', async () => {
    // GIVEN: PUT /api/v1/clientes/:id returns 200
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([EXISTING_CLIENTE])
    );

    // WHEN: Form is submitted successfully
    renderClienteFormEdit();

    fireEvent.change(screen.getByTestId('cliente-form-ciudad'), {
      target: { value: 'Cali' },
    });
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Toast with success message appears
    await waitFor(() => {
      expect(screen.getByText(/cliente actualizado correctamente/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P2-02: Clear required field (Nombre), submit → inline error, PUT not called
// ---------------------------------------------------------------------------

describe('TC-E2-P2-02: Validation blocks submit when required field is cleared', () => {
  it('should display inline error on Nombre field when it is cleared and form is submitted', async () => {
    // GIVEN: ClienteForm rendered in edit mode (pre-filled)
    server.use(handleGetClientesSuccess([EXISTING_CLIENTE]));
    renderClienteFormEdit();

    // WHEN: User clears the Nombre field and clicks Guardar
    fireEvent.change(screen.getByTestId('cliente-form-nombre'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Inline error appears on the Nombre field
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-error-nombre')).toBeInTheDocument();
    });
  });

  it('should NOT send PUT to backend when Nombre is cleared and submitted', async () => {
    // GIVEN: MSW would capture any PUT request
    let putWasCalled = false;
    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesSuccess([EXISTING_CLIENTE]),
      http.put(`/api/v1/clientes/${EXISTING_CLIENTE.id}`, () => {
        putWasCalled = true;
        return HttpResponse.json(EXISTING_CLIENTE, { status: 200 });
      })
    );

    // WHEN: Nombre is cleared and form is submitted
    renderClienteFormEdit();

    fireEvent.change(screen.getByTestId('cliente-form-nombre'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: PUT is NOT called (Zod/RHF validation blocks the submit)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-error-nombre')).toBeInTheDocument();
    });

    expect(putWasCalled).toBe(false);
  });

  it('should NOT send PUT to backend when any required field is cleared', async () => {
    // GIVEN: ClienteForm rendered in edit mode
    // AND: No PUT handler registered (any PUT would cause MSW unhandled request error)
    server.use(handleGetClientesSuccess([EXISTING_CLIENTE]));

    // WHEN: NIT is cleared and form is submitted
    renderClienteFormEdit();

    fireEvent.change(screen.getByTestId('cliente-form-nit'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Inline error appears on NIT field (no PUT triggered — would throw MSW unhandled error otherwise)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-error-nit')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Guardar button disabled while PUT mutation is in flight (isPending)
// ---------------------------------------------------------------------------

describe('ClienteForm edit mode — Guardar disabled while isPending', () => {
  it('should disable the Guardar button while the PUT mutation is in flight', async () => {
    // GIVEN: PUT resolves slowly
    let resolveRequest: () => void;
    const pendingRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesSuccess([EXISTING_CLIENTE]),
      http.put(`/api/v1/clientes/${EXISTING_CLIENTE.id}`, async () => {
        await pendingRequest;
        return HttpResponse.json(
          { ...EXISTING_CLIENTE, updatedAt: '2026-06-29T10:00:00Z' },
          { status: 200 }
        );
      })
    );

    // WHEN: Edit form submitted
    renderClienteFormEdit();
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Guardar button is disabled while pending
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-submit')).toBeDisabled();
    });

    // Cleanup
    resolveRequest!();
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-submit')).not.toBeDisabled();
    });
  });
});
