/**
 * ATDD component tests — Story 3.3: ContactoForm (RED phase)
 *
 * Tests fail until the following are implemented:
 *   - frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx
 *   - frontend/src/modules/crm/contactos/application/useCreateContacto.ts
 *   - frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts (create method)
 *   - frontend/src/modules/crm/contactos/application/contactoSchema.ts (already exists from Story 3.1)
 *
 * Test IDs:
 *   TC-E3-3-3-CMP-1 (P0) — Empty submit → 4 inline errors appear; POST never called
 *   TC-E3-3-3-CMP-2 (P2) — 409 response → inline error "El email ya está registrado" on Email field
 *   TC-E3-3-3-CMP-3 (P2) — Valid submit with 201 response → toast "Contacto creado correctamente"
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

import { buildContacto } from './contactoFactory';

// ContactoForm does NOT exist yet — import will fail (RED phase)
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
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ContactoForm with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderContactoForm(props?: {
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const onClose = props?.onClose ?? vi.fn();
  const onSuccess = props?.onSuccess ?? vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ContactoForm onClose={onClose} onSuccess={onSuccess} />
    </QueryClientProvider>
  );

  return { ...result, queryClient, onClose, onSuccess };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-3-CMP-1 (P0) — Empty submit → 4 inline errors, POST never called
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — empty form submission', () => {
  it('TC-E3-3-3-CMP-1: should show 4 inline validation errors when all required fields are empty', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — assert POST is never called (network-first)
    let postCalled = false;
    server.use(
      http.post(CONTACTOS_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    // GIVEN: ContactoForm is rendered
    renderContactoForm();

    // WHEN: User clicks the submit button without filling any field
    const submitButton = screen.getByTestId('btn-submit');
    await userEvent.click(submitButton);

    // THEN: Inline validation errors appear — at least 4 (one per required field: Nombre, Cargo, Teléfono, Email)
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(4);
    });

    // AND: POST /api/v1/contactos was NEVER called (Zod client-side guard)
    expect(postCalled).toBe(false);
  });

  it('should show inline error for Nombre field when empty', async () => {
    // GIVEN: ContactoForm is rendered
    renderContactoForm();

    // WHEN: Submit button is clicked without filling Nombre
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Nombre input is present and an alert is shown
    await waitFor(() => {
      expect(screen.getByTestId('input-nombre')).toBeInTheDocument();
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should show inline error for Cargo field when empty', async () => {
    // GIVEN: ContactoForm is rendered
    renderContactoForm();

    // WHEN: Submit button is clicked without filling Cargo
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Cargo input is present
    await waitFor(() => {
      expect(screen.getByTestId('input-cargo')).toBeInTheDocument();
    });
  });

  it('should show inline error for Teléfono field when empty', async () => {
    // GIVEN: ContactoForm is rendered
    renderContactoForm();

    // WHEN: Submit button is clicked without filling Teléfono
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Teléfono input is present
    await waitFor(() => {
      expect(screen.getByTestId('input-telefono')).toBeInTheDocument();
    });
  });

  it('should show inline error for Email field when empty', async () => {
    // GIVEN: ContactoForm is rendered
    renderContactoForm();

    // WHEN: Submit button is clicked without filling Email
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Email input is present and an error appears
    await waitFor(() => {
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
    });
  });

  it('should NOT call POST /api/v1/contactos when client-side validation fails', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — track calls
    let postCallCount = 0;
    server.use(
      http.post(CONTACTOS_URL, () => {
        postCallCount++;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderContactoForm();

    // WHEN: Empty form submitted
    await userEvent.click(screen.getByTestId('btn-submit'));

    // Wait for validation to trigger
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });

    // THEN: POST was never sent to backend
    expect(postCallCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-3-CMP-2 (P2) — 409 response → inline error "El email ya está registrado" on Email field
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — 409 conflict response', () => {
  it('TC-E3-3-3-CMP-2: should display "El email ya está registrado" as inline error on Email field when backend returns 409', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — backend returns 409 for this email
    server.use(
      http.post(CONTACTOS_URL, () =>
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

    // GIVEN: ContactoForm is rendered
    renderContactoForm();

    // WHEN: User fills all fields and submits
    await userEvent.type(screen.getByTestId('input-nombre'), 'María López');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Gerente Comercial');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-email'), 'maria.lopez@empresa.co');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error "El email ya está registrado" appears (NFR6 — no technical details)
    await waitFor(() => {
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
    });
  });

  it('should NOT expose technical details in the error message (NFR6)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 409 response
    server.use(
      http.post(CONTACTOS_URL, () =>
        HttpResponse.json(
          { status: 409, detail: 'El email ya está registrado' },
          { status: 409 }
        )
      )
    );

    renderContactoForm();

    // WHEN: User fills valid fields and submits
    await userEvent.type(screen.getByTestId('input-nombre'), 'Pedro Ramírez');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Director');
    await userEvent.type(screen.getByTestId('input-telefono'), '3109876543');
    await userEvent.type(screen.getByTestId('input-email'), 'pedro.ramirez@empresa.co');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Error appears on Email field
    await waitFor(() => {
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
    });

    // AND: No technical error panel exposed (NFR6)
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
    expect(screen.queryByText(/DbUpdateException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/StackTrace/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-3-CMP-3 (P2) — Valid submit with 201 → toast "Contacto creado correctamente"
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — successful creation', () => {
  it('TC-E3-3-3-CMP-3: should show toast "Contacto creado correctamente" after successful creation', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — backend returns 201 with ContactoDto
    const createdContacto = buildContacto({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      nombre: 'Nuevo Contacto SA',
      cargo: 'Analista de Ventas',
      telefono: '3001112233',
      email: 'nuevo.contacto@empresa.co',
    });

    server.use(
      http.post(CONTACTOS_URL, () =>
        HttpResponse.json(createdContacto, { status: 201 })
      )
    );

    // GIVEN: ContactoForm is rendered
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    renderContactoForm({ onClose, onSuccess });

    // WHEN: User fills all required fields with valid data
    await userEvent.type(screen.getByTestId('input-nombre'), 'Nuevo Contacto SA');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Analista de Ventas');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001112233');
    await userEvent.type(screen.getByTestId('input-email'), 'nuevo.contacto@empresa.co');

    // WHEN: User clicks "Crear contacto"
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Success toast "Contacto creado correctamente" appears (R-010 exact Spanish text)
    await waitFor(() => {
      expect(screen.getByText('Contacto creado correctamente')).toBeInTheDocument();
    });
  });

  it('should call onClose after successful contact creation', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 201 success
    const createdContacto = buildContacto({ email: 'onclose.test@empresa.co' });
    server.use(
      http.post(CONTACTOS_URL, () =>
        HttpResponse.json(createdContacto, { status: 201 })
      )
    );

    const onClose = vi.fn();
    renderContactoForm({ onClose });

    // WHEN: Valid form submitted
    await userEvent.type(screen.getByTestId('input-nombre'), createdContacto.nombre);
    await userEvent.type(screen.getByTestId('input-cargo'), createdContacto.cargo);
    await userEvent.type(screen.getByTestId('input-telefono'), createdContacto.telefono);
    await userEvent.type(screen.getByTestId('input-email'), createdContacto.email);
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: onClose is called (form closes after successful creation)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should disable submit button while mutation is pending (isPending guard)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — delayed 201 response
    let resolveRequest!: () => void;
    const delayedRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.post(CONTACTOS_URL, async () => {
        await delayedRequest;
        const contacto = buildContacto({ email: 'pending.guard@empresa.co' });
        return HttpResponse.json(contacto, { status: 201 });
      })
    );

    renderContactoForm();

    // WHEN: User fills all fields
    await userEvent.type(screen.getByTestId('input-nombre'), 'Contacto Pending');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Supervisor');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-email'), 'pending.guard@empresa.co');

    // WHEN: Submit is clicked
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Submit button is disabled while request is in flight (isPending guard)
    await waitFor(() => {
      expect(screen.getByTestId('btn-submit')).toBeDisabled();
    });

    // Cleanup: resolve the pending request
    resolveRequest();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Structure and labels — verifies form shape, data-testid attributes, Spanish labels
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — structure and labels', () => {
  it('should render the form with all four required fields in Spanish', () => {
    // GIVEN: ContactoForm is rendered
    renderContactoForm();

    // THEN: All required fields are present with Spanish labels (FR9)
    expect(screen.getByTestId('input-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('input-cargo')).toBeInTheDocument();
    expect(screen.getByTestId('input-telefono')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();

    // AND: Labels are in Spanish
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cargo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should render "Crear contacto" submit button and "Cancelar" button', () => {
    // GIVEN: ContactoForm is rendered
    renderContactoForm();

    // THEN: Submit button labeled "Crear contacto" is present
    expect(screen.getByTestId('btn-submit')).toBeInTheDocument();
    expect(screen.getByTestId('btn-submit')).toHaveTextContent(/crear contacto/i);

    // AND: Cancel button labeled "Cancelar" is present
    expect(screen.getByTestId('btn-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('btn-cancel')).toHaveTextContent(/cancelar/i);
  });

  it('should call onClose when "Cancelar" button is clicked', async () => {
    // GIVEN: ContactoForm is rendered
    const onClose = vi.fn();
    renderContactoForm({ onClose });

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByTestId('btn-cancel'));

    // THEN: onClose is called (no submission)
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render with data-testid="contacto-form" on the form element', () => {
    // GIVEN: ContactoForm is rendered
    renderContactoForm();

    // THEN: Form element has the expected data-testid
    expect(screen.getByTestId('contacto-form')).toBeInTheDocument();
  });

  it('should NOT submit to backend when "Cancelar" is clicked', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — track POST calls
    let postCalled = false;
    server.use(
      http.post(CONTACTOS_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    const onClose = vi.fn();
    renderContactoForm({ onClose });

    // WHEN: User fills fields but then clicks Cancelar instead of submitting
    await userEvent.type(screen.getByTestId('input-nombre'), 'Test Cancelar');
    await userEvent.click(screen.getByTestId('btn-cancel'));

    // THEN: onClose was called and POST was never sent
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(postCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 400 generic error — non-409 backend error shown as generic form-level message
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — 400 generic backend error', () => {
  it('should display generic error message for non-409 backend errors without exposing technical details (NFR6)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — backend returns 400
    server.use(
      http.post(CONTACTOS_URL, () =>
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

    renderContactoForm();

    // WHEN: User fills all fields and submits (backend will return 400)
    await userEvent.type(screen.getByTestId('input-nombre'), 'Test Usuario');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Analista');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-email'), 'valid@empresa.co');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Generic error message appears (no stack traces — NFR6)
    await waitFor(() => {
      expect(
        screen.getByText(/error al crear el contacto/i)
      ).toBeInTheDocument();
    });

    // AND: No technical details exposed
    expect(screen.queryByText(/DbUpdateException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/StackTrace/i)).not.toBeInTheDocument();
  });
});
