/**
 * ATDD component tests — Story 3.4: Edit Contact (RED phase)
 *
 * Tests fail until the following are implemented:
 *   - frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx (edit mode via contactoId prop)
 *   - frontend/src/modules/crm/contactos/application/useUpdateContacto.ts
 *   - frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts (update method)
 *   - frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx ("Editar" button + dialog)
 *
 * Test IDs:
 *   TC-E3-3-4-CMP-1 (P1) — Edit form pre-fills all four fields from fixture (AC #1, R-007)
 *   TC-E3-3-4-CMP-2 (P1) — Cancel edit restores original values — no PUT called (AC #4, R-008)
 *   TC-E3-3-4-CMP-3 (P1) — Clear required field + submit → inline error, no PUT sent (AC #3)
 *   TC-E3-3-4-CMP-4 (P2) — Valid edit submit → toast "Contacto actualizado correctamente" (AC #2, R-010)
 *   TC-E3-3-4-CMP-5 (P2) — 409 response → Email field inline error "El email ya está registrado"
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'sonner';

import { buildContacto, resetContactoCounter } from './contactoFactory';

// ContactoForm edit mode (contactoId prop) does NOT exist yet — will fail (RED phase)
import { ContactoForm } from '../presentation/ContactoForm';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress expected React / RHF / MSW errors in test output
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('[MSW]') ||
    msg.includes('AxiosError') ||
    msg.includes('Request failed with status code') ||
    msg.includes('act(...)') ||
    msg.includes('not wrapped in act')
  ) {
    return;
  }
  originalConsoleError(...args);
});

const API_BASE = 'http://localhost:5000';
const CONTACTOS_URL = `${API_BASE}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup — handlers registered BEFORE render (network-first pattern)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetContactoCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ContactoForm in EDIT mode with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

const FIXTURE_CONTACTO = buildContacto({
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  nombre: 'María López',
  cargo: 'Directora Comercial',
  telefono: '3009876543',
  email: 'maria.lopez@empresa.co',
});

function renderContactoFormEdit(props?: {
  contactoId?: string;
  defaultValues?: {
    nombre: string;
    cargo: string;
    telefono: string;
    email: string;
  };
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const contactoId = props?.contactoId ?? FIXTURE_CONTACTO.id;
  const defaultValues = props?.defaultValues ?? {
    nombre: FIXTURE_CONTACTO.nombre,
    cargo: FIXTURE_CONTACTO.cargo,
    telefono: FIXTURE_CONTACTO.telefono,
    email: FIXTURE_CONTACTO.email,
  };
  const onClose = props?.onClose ?? vi.fn();
  const onSuccess = props?.onSuccess ?? vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ContactoForm
        contactoId={contactoId}
        defaultValues={defaultValues}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>
  );

  return { ...result, queryClient, onClose, onSuccess };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-4-CMP-1 (P1) — Edit form pre-fills all four fields from fixture (AC #1, R-007)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm edit mode — pre-filled form (TC-E3-3-4-CMP-1)', () => {
  it('TC-E3-3-4-CMP-1: should pre-fill all four input fields with fixture values when opened in edit mode', () => {
    // GIVEN: NETWORK intercepted BEFORE render (network-first pattern — no call expected yet)
    server.use(
      http.put(`${CONTACTOS_URL}/${FIXTURE_CONTACTO.id}`, () =>
        HttpResponse.json(FIXTURE_CONTACTO, { status: 200 })
      )
    );

    // GIVEN: ContactoForm is rendered in EDIT mode with defaultValues from FIXTURE_CONTACTO
    renderContactoFormEdit();

    // THEN: input-nombre is pre-filled with fixture.nombre (R-007 — pre-fill validation)
    expect(screen.getByTestId('input-nombre')).toHaveValue(FIXTURE_CONTACTO.nombre);

    // THEN: input-cargo is pre-filled with fixture.cargo
    expect(screen.getByTestId('input-cargo')).toHaveValue(FIXTURE_CONTACTO.cargo);

    // THEN: input-telefono is pre-filled with fixture.telefono
    expect(screen.getByTestId('input-telefono')).toHaveValue(FIXTURE_CONTACTO.telefono);

    // THEN: input-email is pre-filled with fixture.email
    expect(screen.getByTestId('input-email')).toHaveValue(FIXTURE_CONTACTO.email);
  });

  it('should render "Guardar cambios" as the submit button label in edit mode', () => {
    // GIVEN: ContactoForm is rendered in edit mode
    renderContactoFormEdit();

    // THEN: Submit button shows "Guardar cambios" (NOT "Crear contacto")
    expect(screen.getByTestId('btn-submit')).toHaveTextContent(/guardar cambios/i);
  });

  it('should render "Cancelar" button in edit mode', () => {
    // GIVEN: ContactoForm is rendered in edit mode
    renderContactoFormEdit();

    // THEN: Cancel button labeled "Cancelar" is present
    expect(screen.getByTestId('btn-cancel')).toHaveTextContent(/cancelar/i);
  });

  it('should render with data-testid="contacto-form" on the form element in edit mode', () => {
    // GIVEN: ContactoForm is rendered in edit mode
    renderContactoFormEdit();

    // THEN: Form element has the expected data-testid
    expect(screen.getByTestId('contacto-form')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-4-CMP-2 (P1) — Cancel edit restores original values — no PUT called (AC #4, R-008)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm edit mode — cancel without saving (TC-E3-3-4-CMP-2)', () => {
  it('TC-E3-3-4-CMP-2: should call onClose without making a PUT request when "Cancelar" is clicked', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — track PUT calls to assert none are made
    let putCalled = false;
    server.use(
      http.put(`${CONTACTOS_URL}/${FIXTURE_CONTACTO.id}`, () => {
        putCalled = true;
        return HttpResponse.json(FIXTURE_CONTACTO, { status: 200 });
      })
    );

    const onClose = vi.fn();
    renderContactoFormEdit({ onClose });

    // WHEN: User modifies the Nombre field
    await userEvent.clear(screen.getByTestId('input-nombre'));
    await userEvent.type(screen.getByTestId('input-nombre'), 'Nombre que no se guardará');

    // WHEN: User clicks "Cancelar" (AC #4 — cancel without saving)
    await userEvent.click(screen.getByTestId('btn-cancel'));

    // THEN: onClose is called (form closes)
    expect(onClose).toHaveBeenCalledTimes(1);

    // AND: PUT /api/v1/contactos/:id was NEVER called (R-008 — no API call on cancel)
    expect(putCalled).toBe(false);
  });

  it('should NOT call onSuccess when "Cancelar" is clicked', async () => {
    // GIVEN: ContactoForm is rendered in edit mode
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderContactoFormEdit({ onClose, onSuccess });

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByTestId('btn-cancel'));

    // THEN: onSuccess was NOT called (no save occurred)
    expect(onSuccess).not.toHaveBeenCalled();

    // AND: onClose was called
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-4-CMP-3 (P1) — Clear required field + submit → inline error, no PUT (AC #3)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm edit mode — client-side validation (TC-E3-3-4-CMP-3)', () => {
  it('TC-E3-3-4-CMP-3: should show inline error and NOT call PUT when Nombre is cleared and form is submitted', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — track PUT calls
    let putCallCount = 0;
    server.use(
      http.put(`${CONTACTOS_URL}/${FIXTURE_CONTACTO.id}`, () => {
        putCallCount++;
        return HttpResponse.json(FIXTURE_CONTACTO, { status: 200 });
      })
    );

    renderContactoFormEdit();

    // WHEN: User clears the Nombre field (required field)
    await userEvent.clear(screen.getByTestId('input-nombre'));

    // WHEN: User clicks "Guardar cambios"
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline validation error appears (Zod client-side — FR16)
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    // AND: PUT /api/v1/contactos/:id was NEVER called (Zod client-side guard prevents submission)
    expect(putCallCount).toBe(0);
  });

  it('should show inline error on Email field when Email is cleared and form is submitted', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — track PUT calls
    let putCallCount = 0;
    server.use(
      http.put(`${CONTACTOS_URL}/${FIXTURE_CONTACTO.id}`, () => {
        putCallCount++;
        return HttpResponse.json(FIXTURE_CONTACTO, { status: 200 });
      })
    );

    renderContactoFormEdit();

    // WHEN: User clears the Email field (required field)
    await userEvent.clear(screen.getByTestId('input-email'));

    // WHEN: User submits the form
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error appears on email field (Zod client-side validation)
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });

    // AND: PUT was never called
    expect(putCallCount).toBe(0);
  });

  it('should disable submit button while PUT request is pending (isPending guard)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — delayed response to test isPending state
    let resolveRequest!: () => void;
    const delayedRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const updatedContacto = { ...FIXTURE_CONTACTO, nombre: 'María Actualizada Pending' };
    server.use(
      http.put(`${CONTACTOS_URL}/${FIXTURE_CONTACTO.id}`, async () => {
        await delayedRequest;
        return HttpResponse.json(updatedContacto, { status: 200 });
      })
    );

    renderContactoFormEdit();

    // WHEN: User modifies Nombre and submits
    await userEvent.clear(screen.getByTestId('input-nombre'));
    await userEvent.type(screen.getByTestId('input-nombre'), 'María Actualizada Pending');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Submit button is disabled while PUT is in flight (isPending guard)
    await waitFor(() => {
      expect(screen.getByTestId('btn-submit')).toBeDisabled();
    });

    // AND: Submit button shows "Guardando..." label while pending
    await waitFor(() => {
      expect(screen.getByTestId('btn-submit')).toHaveTextContent(/guardando/i);
    });

    // Cleanup: resolve the pending request
    resolveRequest();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-4-CMP-4 (P2) — Valid edit submit → toast "Contacto actualizado correctamente" (AC #2, R-010)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm edit mode — successful update (TC-E3-3-4-CMP-4)', () => {
  it('TC-E3-3-4-CMP-4: should show toast "Contacto actualizado correctamente" after successful PUT 200', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — backend returns 200 with updated ContactoDto
    const updatedContacto = {
      ...FIXTURE_CONTACTO,
      nombre: 'María López Editada',
      updatedAt: new Date().toISOString(),
    };

    server.use(
      http.put(`${CONTACTOS_URL}/${FIXTURE_CONTACTO.id}`, () =>
        HttpResponse.json(updatedContacto, { status: 200 })
      )
    );

    // GIVEN: ContactoForm is rendered in EDIT mode
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    renderContactoFormEdit({ onClose, onSuccess });

    // WHEN: User modifies Nombre
    await userEvent.clear(screen.getByTestId('input-nombre'));
    await userEvent.type(screen.getByTestId('input-nombre'), 'María López Editada');

    // WHEN: User clicks "Guardar cambios"
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Success toast "Contacto actualizado correctamente" appears (R-010 — exact Spanish text)
    await waitFor(() => {
      expect(screen.getByText('Contacto actualizado correctamente')).toBeInTheDocument();
    });
  });

  it('should call onClose after successful update', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 200 success
    const updatedContacto = { ...FIXTURE_CONTACTO, cargo: 'CEO' };
    server.use(
      http.put(`${CONTACTOS_URL}/${FIXTURE_CONTACTO.id}`, () =>
        HttpResponse.json(updatedContacto, { status: 200 })
      )
    );

    const onClose = vi.fn();
    renderContactoFormEdit({ onClose });

    // WHEN: User modifies Cargo and submits
    await userEvent.clear(screen.getByTestId('input-cargo'));
    await userEvent.type(screen.getByTestId('input-cargo'), 'CEO');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: onClose is called (form closes after successful update)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onSuccess after successful update', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 200 success
    const updatedContacto = { ...FIXTURE_CONTACTO, telefono: '3119999999' };
    server.use(
      http.put(`${CONTACTOS_URL}/${FIXTURE_CONTACTO.id}`, () =>
        HttpResponse.json(updatedContacto, { status: 200 })
      )
    );

    const onSuccess = vi.fn();
    renderContactoFormEdit({ onSuccess });

    // WHEN: User modifies Telefono and submits
    await userEvent.clear(screen.getByTestId('input-telefono'));
    await userEvent.type(screen.getByTestId('input-telefono'), '3119999999');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: onSuccess is called so the parent can refetch detail view (FR27, R-002)
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-4-CMP-5 (P2) — 409 response → Email field inline error "El email ya está registrado"
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm edit mode — 409 conflict response (TC-E3-3-4-CMP-5)', () => {
  it('TC-E3-3-4-CMP-5: should display "El email ya está registrado" as inline error on Email field when backend returns 409', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — backend returns 409 for email conflict
    server.use(
      http.put(`${CONTACTOS_URL}/${FIXTURE_CONTACTO.id}`, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflicto de datos',
            status: 409,
            detail: 'El email ya está registrado',
          },
          { status: 409 }
        )
      )
    );

    // GIVEN: ContactoForm is rendered in edit mode with fixture pre-fills
    renderContactoFormEdit();

    // WHEN: User changes email to a conflicting one and submits
    await userEvent.clear(screen.getByTestId('input-email'));
    await userEvent.type(screen.getByTestId('input-email'), 'otro.contacto.existente@empresa.co');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error "El email ya está registrado" appears on Email field (NFR6 — no technical details)
    await waitFor(() => {
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
    });
  });

  it('should NOT expose technical details (stack traces, DbUpdateException) on 409 response (NFR6)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 409 response
    server.use(
      http.put(`${CONTACTOS_URL}/${FIXTURE_CONTACTO.id}`, () =>
        HttpResponse.json(
          { status: 409, detail: 'El email ya está registrado' },
          { status: 409 }
        )
      )
    );

    renderContactoFormEdit();

    // WHEN: User submits with a conflicting email
    await userEvent.clear(screen.getByTestId('input-email'));
    await userEvent.type(screen.getByTestId('input-email'), 'conflicto@empresa.co');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Error appears on Email field only
    await waitFor(() => {
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
    });

    // AND: No technical details exposed (NFR6)
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
    expect(screen.queryByText(/DbUpdateException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/StackTrace/i)).not.toBeInTheDocument();
  });

  it('should display generic error message for non-409 backend errors in edit mode (NFR6)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — backend returns 400
    server.use(
      http.put(`${CONTACTOS_URL}/${FIXTURE_CONTACTO.id}`, () =>
        HttpResponse.json(
          {
            title: 'One or more validation errors occurred.',
            status: 400,
            errors: { Email: ["'Email' is not a valid email address."] },
          },
          { status: 400 }
        )
      )
    );

    renderContactoFormEdit();

    // WHEN: User submits the form (backend returns 400)
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Generic error message appears (no stack traces — NFR6)
    await waitFor(() => {
      expect(
        screen.getByText(/error al actualizar el contacto/i)
      ).toBeInTheDocument();
    });

    // AND: No technical details exposed
    expect(screen.queryByText(/DbUpdateException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/StackTrace/i)).not.toBeInTheDocument();
  });
});
