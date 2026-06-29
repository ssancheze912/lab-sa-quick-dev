/**
 * Component tests — ContactoForm in edit mode
 * Story 3.4 | Edit Contact
 *
 * Test IDs covered (RED phase — useUpdateContacto.ts does not exist yet):
 *   TC-E3-P1-07   Render form with mode="edit" + contacto → all 4 inputs pre-filled with correct values
 *   TC-E3-P1-08   Open edit form, modify Nombre, click "Cancelar" → onCancel called, PUT NOT triggered
 *   TC-E3-P1-09   Open edit form, change Cargo to "Director", submit → PUT correct payload, toast shown, onSuccess called
 *   TC-E3-P2-02   Open edit form, clear Nombre, submit → inline error on Nombre, PUT not called
 *   TC-E3-email-edit-invalid  Open edit form, enter invalid email, submit → inline error, PUT not called
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failure: "Cannot find module '../application/useUpdateContacto'"
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
  handlePutContactoSuccess,
  handlePutContactoValidationError,
} from '../../../../test/msw/handlers/contactos-update.handlers';
import { handleGetContactosSuccess } from '../../../../test/msw/handlers/contactos.handlers';
import { ContactoForm } from './ContactoForm';
import type { Contacto } from '../domain/Contacto';

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
// Test fixtures
// ---------------------------------------------------------------------------

const EXISTING_CONTACTO: Contacto = {
  id: '00000000-0000-0000-0000-000000000042',
  nombre: 'Ana López',
  cargo: 'Vendedora',
  telefono: '3001234567',
  email: 'ana.lopez@example.com',
  clienteId: null,
  createdAt: '2026-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Helper: render ContactoForm in edit mode with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderContactoFormEdit(props: {
  contacto?: Contacto;
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
          contacto={props.contacto ?? EXISTING_CONTACTO}
          mode="edit"
          onSuccess={props.onSuccess}
          onCancel={props.onCancel}
        />
      </QueryClientProvider>
    ),
  };
}

// ---------------------------------------------------------------------------
// TC-E3-P1-07: Render ContactoForm with mode="edit" → all 4 inputs pre-filled
// ---------------------------------------------------------------------------

describe('TC-E3-P1-07: Edit form renders pre-filled with existing contact values', () => {
  it('TC-E3-P1-07: should pre-fill all 4 inputs with the existing contact values', async () => {
    // GIVEN: MSW is set up (no network calls expected for rendering)
    server.use(handleGetContactosSuccess([]));

    // WHEN: ContactoForm is rendered with mode="edit" and contacto prop
    renderContactoFormEdit({ contacto: EXISTING_CONTACTO });

    // THEN: Nombre input is pre-filled with existing contact's nombre
    expect(
      (screen.getByTestId('contacto-form-nombre') as HTMLInputElement).value
    ).toBe(EXISTING_CONTACTO.nombre);

    // THEN: Cargo input is pre-filled with existing contact's cargo
    expect(
      (screen.getByTestId('contacto-form-cargo') as HTMLInputElement).value
    ).toBe(EXISTING_CONTACTO.cargo);

    // THEN: Telefono input is pre-filled with existing contact's telefono
    expect(
      (screen.getByTestId('contacto-form-telefono') as HTMLInputElement).value
    ).toBe(EXISTING_CONTACTO.telefono);

    // THEN: Email input is pre-filled with existing contact's email
    expect(
      (screen.getByTestId('contacto-form-email') as HTMLInputElement).value
    ).toBe(EXISTING_CONTACTO.email);
  });

  it('should render Guardar and Cancelar buttons in edit mode', () => {
    // GIVEN: MSW is set up
    server.use(handleGetContactosSuccess([]));

    // WHEN: ContactoForm is rendered in edit mode
    renderContactoFormEdit();

    // THEN: Both action buttons are present
    expect(screen.getByTestId('contacto-form-submit')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-form-cancel')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P1-08: Cancel in edit mode — onCancel called, PUT NOT triggered
// ---------------------------------------------------------------------------

describe('TC-E3-P1-08: Cancel in edit mode calls onCancel without PUT', () => {
  it('TC-E3-P1-08: should call onCancel when "Cancelar" is clicked and NOT trigger PUT', async () => {
    // GIVEN: MSW would capture any PUT request — if called, test fails
    let putWasCalled = false;
    server.use(
      handleGetContactosSuccess([]),
      http.put('/api/v1/contactos/:contactoId', () => {
        putWasCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    const onCancelMock = vi.fn();

    // WHEN: Edit form is rendered and user modifies Nombre
    renderContactoFormEdit({ onCancel: onCancelMock });

    fireEvent.change(screen.getByTestId('contacto-form-nombre'), {
      target: { value: 'Nombre Modificado' },
    });

    // WHEN: User clicks "Cancelar"
    fireEvent.click(screen.getByTestId('contacto-form-cancel'));

    // THEN: onCancel was called
    expect(onCancelMock).toHaveBeenCalledTimes(1);

    // THEN: PUT was NOT triggered
    expect(putWasCalled).toBe(false);
  });

  it('should call onCancel without modifying any field', () => {
    // GIVEN: MSW is set up
    server.use(handleGetContactosSuccess([]));

    const onCancelMock = vi.fn();

    // WHEN: Edit form is rendered and user immediately clicks "Cancelar"
    renderContactoFormEdit({ onCancel: onCancelMock });
    fireEvent.click(screen.getByTestId('contacto-form-cancel'));

    // THEN: onCancel is called
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P1-09: Successful edit — PUT with correct payload, toast, onSuccess
// ---------------------------------------------------------------------------

describe('TC-E3-P1-09: Successful edit submit — PUT correct payload, toast shown, onSuccess called', () => {
  it('TC-E3-P1-09: should send PUT to /api/v1/contactos/:id with updated cargo', async () => {
    // GIVEN: MSW captures and validates the request body for PUT
    let capturedBody: Record<string, string> | null = null;

    server.use(
      handleGetContactosSuccess([]),
      http.put('/api/v1/contactos/:contactoId', async ({ params, request }) => {
        capturedBody = (await request.json()) as Record<string, string>;
        return HttpResponse.json(
          {
            id: params.contactoId,
            ...capturedBody,
            clienteId: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    // WHEN: Edit form is rendered, Cargo is changed to "Director", and Guardar is clicked
    renderContactoFormEdit();

    fireEvent.change(screen.getByTestId('contacto-form-cargo'), {
      target: { value: 'Director' },
    });

    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: PUT body has the updated cargo value and all other original fields
    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });

    expect(capturedBody!.nombre).toBe(EXISTING_CONTACTO.nombre);
    expect(capturedBody!.cargo).toBe('Director');
    expect(capturedBody!.telefono).toBe(EXISTING_CONTACTO.telefono);
    expect(capturedBody!.email).toBe(EXISTING_CONTACTO.email);
  });

  it('TC-E3-P1-09: should show success toast "Contacto actualizado correctamente" after PUT 200', async () => {
    // GIVEN: MSW returns 200 for PUT
    server.use(
      handleGetContactosSuccess([]),
      handlePutContactoSuccess()
    );

    // WHEN: Edit form is rendered and submitted
    renderContactoFormEdit();
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Success toast message appears
    await waitFor(() => {
      expect(screen.getByText(/contacto actualizado correctamente/i)).toBeInTheDocument();
    });
  });

  it('TC-E3-P1-09: should call onSuccess after PUT returns 200', async () => {
    // GIVEN: MSW returns 200 for PUT
    server.use(
      handleGetContactosSuccess([]),
      handlePutContactoSuccess()
    );

    const onSuccessMock = vi.fn();

    // WHEN: Edit form is rendered and submitted with valid data
    renderContactoFormEdit({ onSuccess: onSuccessMock });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: onSuccess is called once
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should disable Guardar button while PUT is in flight (isPending)', async () => {
    // GIVEN: PUT resolves slowly
    let resolveRequest: () => void;
    const pendingRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      handleGetContactosSuccess([]),
      http.put('/api/v1/contactos/:contactoId', async ({ params }) => {
        await pendingRequest;
        return HttpResponse.json(
          {
            id: params.contactoId,
            ...EXISTING_CONTACTO,
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    // WHEN: Edit form is submitted
    renderContactoFormEdit();
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
// TC-E3-P2-02: Clear required field in edit mode — inline error, PUT not called
// ---------------------------------------------------------------------------

describe('TC-E3-P2-02: Clear required Nombre in edit mode blocks PUT', () => {
  it('TC-E3-P2-02: should show inline error on Nombre field and NOT call PUT when Nombre is cleared', async () => {
    // GIVEN: MSW would capture any PUT request
    let putWasCalled = false;
    server.use(
      handleGetContactosSuccess([]),
      http.put('/api/v1/contactos/:contactoId', () => {
        putWasCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    // WHEN: Edit form is rendered, Nombre is cleared, and Guardar is clicked
    renderContactoFormEdit();

    fireEvent.change(screen.getByTestId('contacto-form-nombre'), {
      target: { value: '' },
    });

    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Inline error for Nombre field is visible
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-nombre')).toBeInTheDocument();
    });

    // THEN: PUT was NOT called (Zod blocked submission)
    expect(putWasCalled).toBe(false);
  });

  it('should show inline errors on all 4 required fields when all are cleared', async () => {
    // GIVEN: MSW is set up
    server.use(handleGetContactosSuccess([]));

    // WHEN: Edit form is rendered, all fields are cleared, and Guardar is clicked
    renderContactoFormEdit();

    fireEvent.change(screen.getByTestId('contacto-form-nombre'), { target: { value: '' } });
    fireEvent.change(screen.getByTestId('contacto-form-cargo'), { target: { value: '' } });
    fireEvent.change(screen.getByTestId('contacto-form-telefono'), { target: { value: '' } });
    fireEvent.change(screen.getByTestId('contacto-form-email'), { target: { value: '' } });

    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: All 4 inline error messages are visible
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-nombre')).toBeInTheDocument();
      expect(screen.getByTestId('contacto-form-error-cargo')).toBeInTheDocument();
      expect(screen.getByTestId('contacto-form-error-telefono')).toBeInTheDocument();
      expect(screen.getByTestId('contacto-form-error-email')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-email-edit-invalid: Invalid email in edit mode — inline error, PUT not called
// ---------------------------------------------------------------------------

describe('TC-E3-email-edit-invalid: Invalid email in edit mode blocks PUT', () => {
  it('TC-E3-email-edit-invalid: should show "El email no tiene un formato válido" and NOT call PUT when email is invalid', async () => {
    // GIVEN: MSW would capture any PUT request
    let putWasCalled = false;
    server.use(
      handleGetContactosSuccess([]),
      http.put('/api/v1/contactos/:contactoId', () => {
        putWasCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    // WHEN: Edit form is rendered, email is changed to invalid format, and Guardar is clicked
    renderContactoFormEdit();

    fireEvent.change(screen.getByTestId('contacto-form-email'), {
      target: { value: 'correo-invalido' },
    });

    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Inline email error message appears
    await waitFor(() => {
      expect(
        screen.getByText(/el email no tiene un formato válido/i)
      ).toBeInTheDocument();
    });

    // THEN: PUT was NOT called (Zod blocked submission)
    expect(putWasCalled).toBe(false);
  });

  it('should display error on email-field testid when email is invalid in edit mode', async () => {
    // GIVEN: ContactoForm in edit mode is rendered
    server.use(handleGetContactosSuccess([]));

    // WHEN: Email is set to invalid and form is submitted
    renderContactoFormEdit();

    fireEvent.change(screen.getByTestId('contacto-form-email'), {
      target: { value: 'sinArroba' },
    });

    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: The email error container is visible
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-email')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Backend error handling in edit mode (AC-6, AC-7)
// ---------------------------------------------------------------------------

describe('Backend error handling in edit mode', () => {
  it('should display generic error message when backend returns 400 on PUT', async () => {
    // GIVEN: MSW returns 400 for PUT /api/v1/contactos/:id
    server.use(
      handleGetContactosSuccess([]),
      handlePutContactoValidationError()
    );

    // WHEN: Edit form is rendered and submitted with valid data (passes Zod)
    renderContactoFormEdit();
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Generic error message is shown (not technical details)
    await waitFor(() => {
      expect(
        screen.getByText(/error al actualizar el contacto/i)
      ).toBeInTheDocument();
    });
  });

  it('should NOT expose stack trace or technical details in the UI on PUT 400 (NFR6)', async () => {
    // GIVEN: MSW returns 400 with Problem Details
    server.use(
      handleGetContactosSuccess([]),
      handlePutContactoValidationError()
    );

    // WHEN: Edit form is submitted and backend returns 400
    renderContactoFormEdit();
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/error al actualizar el contacto/i)
      ).toBeInTheDocument();
    });

    // THEN: No stack trace or internal error details shown in the UI (NFR6)
    expect(screen.queryByText(/stackTrace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/innerException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/exception/i)).not.toBeInTheDocument();
  });

  it('should NOT call onSuccess when backend returns 400 on PUT', async () => {
    // GIVEN: MSW returns 400 for PUT
    server.use(
      handleGetContactosSuccess([]),
      handlePutContactoValidationError()
    );

    const onSuccessMock = vi.fn();

    // WHEN: Edit form is submitted and backend returns 400
    renderContactoFormEdit({ onSuccess: onSuccessMock });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    await waitFor(() => {
      expect(
        screen.getByText(/error al actualizar el contacto/i)
      ).toBeInTheDocument();
    });

    // THEN: onSuccess was NOT called
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});
