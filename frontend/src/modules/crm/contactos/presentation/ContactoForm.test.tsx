/**
 * Component tests — ContactoForm
 * Story 3.3 | Create Contact
 *
 * Test IDs covered (RED phase — ContactoForm.tsx does not exist yet):
 *   TC-E3-P0-04   Fill all fields, submit → POST 201 → toast + onSuccess called
 *   TC-E3-P0-05B  Leave fields empty, submit → inline errors per field, POST not called
 *   TC-E3-email-invalid  Submit with invalid email → inline error "El email no tiene un formato válido"
 *   (cancel)      Click "Cancelar" → onCancel called, POST not triggered
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failure: "Cannot find module './ContactoForm'"
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import {
  handlePostContactoSuccess,
  handlePostContactoValidationError,
} from '../../../../test/msw/handlers/contactos-create.handlers';
import { handleGetContactosSuccess } from '../../../../test/msw/handlers/contactos.handlers';
import { createContactos } from '../../../../test/factories/contacto.factory';
import { ContactoForm } from './ContactoForm';

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
// Helper: render ContactoForm with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderContactoForm(props: {
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
        <ContactoForm
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
  cargo?: string;
  telefono?: string;
  email?: string;
} = {}) {
  if (data.nombre !== undefined) {
    fireEvent.change(screen.getByTestId('contacto-form-nombre'), {
      target: { value: data.nombre },
    });
  }
  if (data.cargo !== undefined) {
    fireEvent.change(screen.getByTestId('contacto-form-cargo'), {
      target: { value: data.cargo },
    });
  }
  if (data.telefono !== undefined) {
    fireEvent.change(screen.getByTestId('contacto-form-telefono'), {
      target: { value: data.telefono },
    });
  }
  if (data.email !== undefined) {
    fireEvent.change(screen.getByTestId('contacto-form-email'), {
      target: { value: data.email },
    });
  }
}

const VALID_DATA = {
  nombre: 'Ana García',
  cargo: 'Directora Comercial',
  telefono: '3101234567',
  email: 'ana.garcia@siesa.com',
};

// ---------------------------------------------------------------------------
// ContactoForm renders all 4 required fields with correct labels
// ---------------------------------------------------------------------------

describe('ContactoForm renders all required fields', () => {
  it('should render all 4 form fields with data-testid attributes', async () => {
    // GIVEN: ContactoForm is rendered
    server.use(handleGetContactosSuccess([]));
    renderContactoForm();

    // THEN: All 4 fields are visible with data-testid attributes
    expect(screen.getByTestId('contacto-form-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-form-cargo')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-form-telefono')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-form-email')).toBeInTheDocument();
  });

  it('should render Guardar and Cancelar buttons', async () => {
    // GIVEN: ContactoForm is rendered
    server.use(handleGetContactosSuccess([]));
    renderContactoForm();

    // THEN: Both action buttons are present
    expect(screen.getByTestId('contacto-form-submit')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-form-cancel')).toBeInTheDocument();
  });

  it('should render Spanish labels for all fields', async () => {
    // GIVEN: ContactoForm is rendered
    server.use(handleGetContactosSuccess([]));
    renderContactoForm();

    // THEN: Spanish labels are visible
    expect(screen.getByText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByText(/cargo/i)).toBeInTheDocument();
    expect(screen.getByText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByText(/email/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P0-04: Fill all fields, submit → POST 201 → toast + onSuccess called
// ---------------------------------------------------------------------------

describe('TC-E3-P0-04: Successful contact creation', () => {
  it('should call onSuccess after form is submitted with valid data and backend returns 201', async () => {
    // GIVEN: MSW returns 201 for POST /api/v1/contactos
    server.use(
      handlePostContactoSuccess(),
      handleGetContactosSuccess(createContactos(1))
    );

    const onSuccessMock = vi.fn();

    // WHEN: ContactoForm is rendered, all 4 fields are filled, and "Guardar" is clicked
    renderContactoForm({ onSuccess: onSuccessMock });

    fillForm(VALID_DATA);

    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: onSuccess is called (form submission and mutation succeeded)
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should show success toast "Contacto creado correctamente" after 201 response', async () => {
    // GIVEN: MSW returns 201
    server.use(
      handlePostContactoSuccess(),
      handleGetContactosSuccess(createContactos(1))
    );

    // WHEN: ContactoForm is rendered and submitted with valid data
    renderContactoForm();

    fillForm(VALID_DATA);

    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Toast with success message appears
    await waitFor(() => {
      expect(screen.getByText(/contacto creado correctamente/i)).toBeInTheDocument();
    });
  });

  it('should send POST to /api/v1/contactos with all 4 fields in the request body', async () => {
    // GIVEN: MSW captures and validates the request body
    let capturedBody: Record<string, string> | null = null;

    server.use(
      handleGetContactosSuccess(createContactos(1)),
      http.post('/api/v1/contactos', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, string>;
        return HttpResponse.json(
          {
            id: '00000000-0000-0000-0000-000000000099',
            ...capturedBody,
            clienteId: null,
            createdAt: '2026-06-29T10:00:00Z',
          },
          { status: 201 }
        );
      })
    );

    // WHEN: Form is submitted with valid data
    renderContactoForm();
    fillForm(VALID_DATA);
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: POST body contains all 4 required fields
    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });

    expect(capturedBody!.nombre).toBe(VALID_DATA.nombre);
    expect(capturedBody!.cargo).toBe(VALID_DATA.cargo);
    expect(capturedBody!.telefono).toBe(VALID_DATA.telefono);
    expect(capturedBody!.email).toBe(VALID_DATA.email);
  });

  it('should disable the Guardar button while mutation is in flight (isPending)', async () => {
    // GIVEN: POST resolves slowly
    let resolveRequest: () => void;
    const pendingRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      handleGetContactosSuccess(createContactos(1)),
      http.post('/api/v1/contactos', async () => {
        await pendingRequest;
        return HttpResponse.json(
          {
            id: '00000000-0000-0000-0000-000000000099',
            ...VALID_DATA,
            clienteId: null,
            createdAt: '2026-06-29T10:00:00Z',
          },
          { status: 201 }
        );
      })
    );

    // WHEN: Form is submitted
    renderContactoForm();
    fillForm(VALID_DATA);
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Submit button is disabled while pending
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-submit')).toBeDisabled();
    });

    // Cleanup
    resolveRequest!();
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-submit')).not.toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P0-05B: Empty form submit → inline errors, POST not called
// ---------------------------------------------------------------------------

describe('TC-E3-P0-05B: Client-side validation blocks submission on empty fields', () => {
  it('should display inline error on nombre field when form is submitted empty', async () => {
    // GIVEN: No handlers needed — form should not reach network
    server.use(handleGetContactosSuccess([]));

    // WHEN: ContactoForm is rendered and Guardar is clicked with all fields empty
    renderContactoForm();

    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Inline error appears for the nombre field
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-nombre')).toBeInTheDocument();
    });
  });

  it('should display inline errors on all 4 required fields when form is submitted empty', async () => {
    // GIVEN: ContactoForm is rendered
    server.use(handleGetContactosSuccess([]));
    renderContactoForm();

    // WHEN: User clicks Guardar without filling any field
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: All 4 inline error messages are visible
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-nombre')).toBeInTheDocument();
      expect(screen.getByTestId('contacto-form-error-cargo')).toBeInTheDocument();
      expect(screen.getByTestId('contacto-form-error-telefono')).toBeInTheDocument();
      expect(screen.getByTestId('contacto-form-error-email')).toBeInTheDocument();
    });
  });

  it('should NOT send POST to backend when required fields are empty (Zod blocks submit)', async () => {
    // GIVEN: MSW would capture any POST request
    let postWasCalled = false;
    server.use(
      handleGetContactosSuccess([]),
      http.post('/api/v1/contactos', () => {
        postWasCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    // WHEN: Form is submitted with all fields empty
    renderContactoForm();
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: POST to backend is NOT called
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-nombre')).toBeInTheDocument();
    });

    expect(postWasCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-E3-email-invalid: Invalid email → inline error message, POST not called
// ---------------------------------------------------------------------------

describe('TC-E3-email-invalid: Invalid email format shows inline error', () => {
  it('should display "El email no tiene un formato válido" when email is invalid', async () => {
    // GIVEN: ContactoForm is rendered — no network handler needed (Zod blocks)
    server.use(handleGetContactosSuccess([]));

    // WHEN: Form is filled with invalid email and submitted
    renderContactoForm();
    fillForm({
      nombre: 'Ana García',
      cargo: 'Directora',
      telefono: '3101234567',
      email: 'no-es-un-email-valido',
    });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Inline error with specific email format message appears
    await waitFor(() => {
      expect(
        screen.getByText(/el email no tiene un formato válido/i)
      ).toBeInTheDocument();
    });
  });

  it('should NOT send POST to backend when email format is invalid (Zod blocks submit)', async () => {
    // GIVEN: MSW would capture any POST request
    let postWasCalled = false;
    server.use(
      handleGetContactosSuccess([]),
      http.post('/api/v1/contactos', () => {
        postWasCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    // WHEN: Form is submitted with an invalid email
    renderContactoForm();
    fillForm({
      nombre: 'Ana García',
      cargo: 'Directora',
      telefono: '3101234567',
      email: 'correo-invalido',
    });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/el email no tiene un formato válido/i)
      ).toBeInTheDocument();
    });

    // THEN: POST to backend is NOT called
    expect(postWasCalled).toBe(false);
  });

  it('should display error on email-field testid when email is invalid', async () => {
    // GIVEN: ContactoForm is rendered
    server.use(handleGetContactosSuccess([]));

    // WHEN: Form is submitted with invalid email
    renderContactoForm();
    fillForm({
      nombre: 'Ana García',
      cargo: 'Directora',
      telefono: '3101234567',
      email: 'sinArroba',
    });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: The email error container is visible
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-email')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Cancel behavior: clicking "Cancelar" calls onCancel, POST not triggered
// ---------------------------------------------------------------------------

describe('Cancel behavior: Cancelar button closes form without mutation', () => {
  it('should call onCancel when "Cancelar" button is clicked', async () => {
    // GIVEN: ContactoForm is rendered with an onCancel callback
    server.use(handleGetContactosSuccess([]));

    const onCancelMock = vi.fn();
    renderContactoForm({ onCancel: onCancelMock });

    // WHEN: User clicks Cancelar
    fireEvent.click(screen.getByTestId('contacto-form-cancel'));

    // THEN: onCancel is called
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('should NOT send POST to backend when Cancelar is clicked', async () => {
    // GIVEN: MSW would capture any POST request
    let postWasCalled = false;
    server.use(
      handleGetContactosSuccess([]),
      http.post('/api/v1/contactos', () => {
        postWasCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    const onCancelMock = vi.fn();
    renderContactoForm({ onCancel: onCancelMock });

    // Partially fill the form
    fillForm({ nombre: 'Contacto Parcial', cargo: 'Analista' });

    // WHEN: User clicks Cancelar
    fireEvent.click(screen.getByTestId('contacto-form-cancel'));

    // THEN: POST was not sent
    expect(postWasCalled).toBe(false);
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Backend 400 error: displayed without technical details
// ---------------------------------------------------------------------------

describe('Backend error handling (AC-5)', () => {
  it('should display error message when backend returns 400 validation error', async () => {
    // GIVEN: MSW returns 400 for POST /api/v1/contactos
    server.use(
      handlePostContactoValidationError(),
      handleGetContactosSuccess([])
    );

    // WHEN: Form is submitted with valid data (passes Zod) but backend returns 400
    renderContactoForm();
    fillForm(VALID_DATA);
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Some error message is shown (generic "Error al crear el contacto")
    await waitFor(() => {
      expect(
        screen.getByText(/error al crear el contacto/i)
      ).toBeInTheDocument();
    });
  });

  it('should NOT expose stack trace or technical details in the UI on 400', async () => {
    // GIVEN: MSW returns 400
    server.use(
      handlePostContactoValidationError(),
      handleGetContactosSuccess([])
    );

    // WHEN: Form is submitted and backend returns 400
    renderContactoForm();
    fillForm(VALID_DATA);
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/error al crear el contacto/i)
      ).toBeInTheDocument();
    });

    // THEN: No stack trace or internal error details shown in the UI (NFR6)
    expect(screen.queryByText(/stackTrace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/innerException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/exception/i)).not.toBeInTheDocument();
  });

  it('should NOT call onSuccess when backend returns 400', async () => {
    // GIVEN: MSW returns 400
    server.use(
      handlePostContactoValidationError(),
      handleGetContactosSuccess([])
    );

    const onSuccessMock = vi.fn();

    // WHEN: Form is submitted and backend returns 400
    renderContactoForm({ onSuccess: onSuccessMock });
    fillForm(VALID_DATA);
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/error al crear el contacto/i)
      ).toBeInTheDocument();
    });

    // THEN: onSuccess was NOT called
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});
