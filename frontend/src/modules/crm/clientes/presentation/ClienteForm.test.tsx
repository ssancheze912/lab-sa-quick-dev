/**
 * Component tests — ClienteForm
 * Story 2.3 | Create Client
 *
 * Test IDs covered (RED phase — ClienteForm.tsx does not exist yet):
 *   TC-E2-P0-04   Fill all fields, submit → POST 201 → toast + onSuccess called
 *   TC-E2-P0-05B  Leave fields empty, submit → inline errors per field, POST not called
 *   TC-E2-P2-03   Submit → POST 409 → error "El NIT/RUC ya está registrado" shown inline
 *   (cancel)      Click "Cancelar" → onCancel called, POST not triggered
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failure: "Cannot find module '../ClienteForm'"
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import React from 'react';
import {
  handlePostClienteSuccess,
  handlePostClienteConflict,
} from '../../../../test/msw/handlers/clientes-create.handlers';
import { handleGetClientesSuccess } from '../../../../test/msw/handlers/clientes.handlers';
import { createClientes } from '../../../../test/factories/cliente.factory';
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
// Helper: render ClienteForm with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderClienteForm(props: {
  onSuccess?: () => void;
  onCancel?: () => void;
} = {}) {
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
        <ClienteForm
          onSuccess={props.onSuccess}
          onCancel={props.onCancel}
        />
      </QueryClientProvider>
    ),
  };
}

// ---------------------------------------------------------------------------
// Helpers to fill and submit the form
// ---------------------------------------------------------------------------

function fillForm(data: {
  nombre?: string;
  nit?: string;
  telefono?: string;
  ciudad?: string;
} = {}) {
  if (data.nombre !== undefined) {
    fireEvent.change(screen.getByTestId('cliente-form-nombre'), {
      target: { value: data.nombre },
    });
  }
  if (data.nit !== undefined) {
    fireEvent.change(screen.getByTestId('cliente-form-nit'), {
      target: { value: data.nit },
    });
  }
  if (data.telefono !== undefined) {
    fireEvent.change(screen.getByTestId('cliente-form-telefono'), {
      target: { value: data.telefono },
    });
  }
  if (data.ciudad !== undefined) {
    fireEvent.change(screen.getByTestId('cliente-form-ciudad'), {
      target: { value: data.ciudad },
    });
  }
}

const VALID_DATA = {
  nombre: 'Acme Corp',
  nit: '900123456-7',
  telefono: '3001234567',
  ciudad: 'Bogotá',
};

// ---------------------------------------------------------------------------
// TC-E2-P0-04: Fill all fields, submit → POST 201 → toast + onSuccess called
// ---------------------------------------------------------------------------

describe('TC-E2-P0-04: Successful client creation', () => {
  it('should call onSuccess after form is submitted with valid data and backend returns 201', async () => {
    // GIVEN: MSW returns 201 for POST /api/v1/clientes
    // AND: MSW handles GET /api/v1/clientes for cache invalidation refetch
    server.use(
      handlePostClienteSuccess(),
      handleGetClientesSuccess(createClientes(1))
    );

    const onSuccessMock = vi.fn();

    // WHEN: ClienteForm is rendered, all 4 fields are filled, and "Guardar" is clicked
    renderClienteForm({ onSuccess: onSuccessMock });

    fillForm(VALID_DATA);

    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: onSuccess is called (form submission and mutation succeeded)
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should show success toast "Cliente creado correctamente" after 201 response', async () => {
    // GIVEN: MSW returns 201
    server.use(
      handlePostClienteSuccess(),
      handleGetClientesSuccess(createClientes(1))
    );

    // WHEN: ClienteForm is rendered and submitted with valid data
    renderClienteForm();

    fillForm(VALID_DATA);

    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Toast with success message appears
    await waitFor(() => {
      expect(screen.getByText(/cliente creado correctamente/i)).toBeInTheDocument();
    });
  });

  it('should send POST to /api/v1/clientes with all 4 fields in the request body', async () => {
    // GIVEN: MSW captures and validates the request body
    let capturedBody: Record<string, string> | null = null;

    server.use(
      handleGetClientesSuccess(createClientes(1)),
      // Override the handler to capture the request body
      ...(() => {
        const { http, HttpResponse } = require('msw');
        return [
          http.post('/api/v1/clientes', async ({ request }: { request: Request }) => {
            capturedBody = (await request.json()) as Record<string, string>;
            return HttpResponse.json(
              {
                id: '00000000-0000-0000-0000-000000000099',
                ...capturedBody,
                createdAt: '2026-06-29T10:00:00Z',
              },
              { status: 201 }
            );
          }),
        ];
      })()
    );

    // WHEN: Form is submitted with valid data
    renderClienteForm();
    fillForm(VALID_DATA);
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: POST body contains all 4 required fields
    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });

    expect(capturedBody!.nombre).toBe(VALID_DATA.nombre);
    expect(capturedBody!.nit).toBe(VALID_DATA.nit);
    expect(capturedBody!.telefono).toBe(VALID_DATA.telefono);
    expect(capturedBody!.ciudad).toBe(VALID_DATA.ciudad);
  });

  it('should disable the Guardar button while mutation is in flight (isPending)', async () => {
    // GIVEN: POST resolves slowly
    let resolveRequest: () => void;
    const pendingRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesSuccess(createClientes(1)),
      http.post('/api/v1/clientes', async () => {
        await pendingRequest;
        return HttpResponse.json(
          { id: '00000000-0000-0000-0000-000000000099', ...VALID_DATA, createdAt: '2026-06-29T10:00:00Z' },
          { status: 201 }
        );
      })
    );

    // WHEN: Form is submitted
    renderClienteForm();
    fillForm(VALID_DATA);
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Submit button is disabled while pending
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

// ---------------------------------------------------------------------------
// TC-E2-P0-05 Part B: Empty form submit → inline errors, POST not called
// ---------------------------------------------------------------------------

describe('TC-E2-P0-05B: Client-side validation blocks submission on empty fields', () => {
  it('should display inline error on nombre field when form is submitted empty', async () => {
    // GIVEN: No handlers needed — form should not reach network
    server.use(handleGetClientesSuccess([]));

    // WHEN: ClienteForm is rendered and Guardar is clicked with all fields empty
    renderClienteForm();

    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Inline error appears for the nombre field
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-error-nombre')).toBeInTheDocument();
    });
  });

  it('should display inline errors on all 4 required fields when form is submitted empty', async () => {
    // GIVEN: ClienteForm is rendered
    server.use(handleGetClientesSuccess([]));
    renderClienteForm();

    // WHEN: User clicks Guardar without filling any field
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: All 4 inline error messages are visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-error-nombre')).toBeInTheDocument();
      expect(screen.getByTestId('cliente-form-error-nit')).toBeInTheDocument();
      expect(screen.getByTestId('cliente-form-error-telefono')).toBeInTheDocument();
      expect(screen.getByTestId('cliente-form-error-ciudad')).toBeInTheDocument();
    });
  });

  it('should NOT send POST to backend when required fields are empty (Zod blocks submit)', async () => {
    // GIVEN: MSW would capture any POST request
    let postWasCalled = false;
    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesSuccess([]),
      http.post('/api/v1/clientes', () => {
        postWasCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    // WHEN: Form is submitted with all fields empty
    renderClienteForm();
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: POST to backend is NOT called
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-error-nombre')).toBeInTheDocument();
    });

    expect(postWasCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P2-03: POST 409 → "El NIT/RUC ya está registrado" shown inline
// ---------------------------------------------------------------------------

describe('TC-E2-P2-03: 409 Conflict shows NIT duplicate error inline', () => {
  it('should display "El NIT/RUC ya está registrado" inline when backend returns 409', async () => {
    // GIVEN: MSW returns 409 Conflict for the NIT already in use
    server.use(
      handlePostClienteConflict(),
      handleGetClientesSuccess(createClientes(1))
    );

    // WHEN: Form is submitted with a valid payload (passes Zod) but NIT conflicts
    renderClienteForm();
    fillForm(VALID_DATA);
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Inline error with the specific NIT conflict message appears
    await waitFor(() => {
      expect(
        screen.getByText(/el nit\/ruc ya está registrado/i)
      ).toBeInTheDocument();
    });
  });

  it('should NOT expose stack trace or technical details in the UI on 409', async () => {
    // GIVEN: MSW returns 409 Conflict
    server.use(
      handlePostClienteConflict(),
      handleGetClientesSuccess(createClientes(1))
    );

    // WHEN: Form is submitted and backend returns 409
    renderClienteForm();
    fillForm(VALID_DATA);
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/el nit\/ruc ya está registrado/i)
      ).toBeInTheDocument();
    });

    // THEN: No stack trace or internal error details shown in the UI
    expect(screen.queryByText(/stackTrace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/innerException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/exception/i)).not.toBeInTheDocument();
  });

  it('should NOT call onSuccess when backend returns 409', async () => {
    // GIVEN: MSW returns 409 Conflict
    server.use(
      handlePostClienteConflict(),
      handleGetClientesSuccess(createClientes(1))
    );

    const onSuccessMock = vi.fn();

    // WHEN: Form is submitted and backend returns 409
    renderClienteForm({ onSuccess: onSuccessMock });
    fillForm(VALID_DATA);
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/el nit\/ruc ya está registrado/i)
      ).toBeInTheDocument();
    });

    // THEN: onSuccess was NOT called
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Cancel behavior: clicking "Cancelar" calls onCancel, POST not triggered
// ---------------------------------------------------------------------------

describe('Cancel behavior: Cancelar button closes form without mutation', () => {
  it('should call onCancel when "Cancelar" button is clicked', async () => {
    // GIVEN: ClienteForm is rendered with an onCancel callback
    server.use(handleGetClientesSuccess([]));

    const onCancelMock = vi.fn();
    renderClienteForm({ onCancel: onCancelMock });

    // WHEN: User clicks Cancelar
    fireEvent.click(screen.getByTestId('cliente-form-cancel'));

    // THEN: onCancel is called
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('should NOT send POST to backend when Cancelar is clicked', async () => {
    // GIVEN: MSW would capture any POST request
    let postWasCalled = false;
    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesSuccess([]),
      http.post('/api/v1/clientes', () => {
        postWasCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    const onCancelMock = vi.fn();
    renderClienteForm({ onCancel: onCancelMock });

    // Partially fill the form
    fillForm({ nombre: 'Empresa Parcial', nit: '900111222-3' });

    // WHEN: User clicks Cancelar
    fireEvent.click(screen.getByTestId('cliente-form-cancel'));

    // THEN: POST was not sent
    expect(postWasCalled).toBe(false);
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Form renders all 4 required fields with correct labels
// ---------------------------------------------------------------------------

describe('ClienteForm renders all required fields', () => {
  it('should render all 4 form fields with Spanish labels', async () => {
    // GIVEN: ClienteForm is rendered
    server.use(handleGetClientesSuccess([]));
    renderClienteForm();

    // THEN: All 4 fields are visible with data-testid attributes
    expect(screen.getByTestId('cliente-form-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-form-nit')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-form-telefono')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-form-ciudad')).toBeInTheDocument();
  });

  it('should render Guardar and Cancelar buttons', async () => {
    // GIVEN: ClienteForm is rendered
    server.use(handleGetClientesSuccess([]));
    renderClienteForm();

    // THEN: Both action buttons are present
    expect(screen.getByTestId('cliente-form-submit')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-form-cancel')).toBeInTheDocument();
  });
});
