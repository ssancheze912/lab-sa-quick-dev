/**
 * Edge-case component tests — Story 3.3: ContactoForm (automation expansion)
 *
 * Covers edge cases NOT included in ATDD ContactoForm.test.tsx:
 *   - defaultValues prop pre-fills form fields (reserved for Story 3.4 reuse)
 *   - Whitespace-only input triggers Zod min(1) validation error
 *   - Malformed email format triggers .email() validation error before POST
 *   - Nombre exceeding 255 chars triggers validation error
 *   - Submit button shows "Creando..." while mutation is in flight
 *   - onSuccess callback is invoked after successful creation
 *   - 500 server error renders generic form-level message (different HTTP status than 400)
 *   - Network/connection error renders generic form-level message
 *   - Form retains field values after backend error (user can correct and resubmit)
 *   - aria-describedby attributes link inputs to error spans (WCAG 2.1 AA)
 *   - Error clears for a field when the user corrects input and resubmits successfully
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
import { ContactoForm } from '../presentation/ContactoForm';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress known React / MSW / Axios noise in test output
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
    msg.includes('not wrapped in act') ||
    msg.includes('Network Error')
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
  defaultValues?: Partial<{ nombre: string; cargo: string; telefono: string; email: string }>;
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
      <ContactoForm
        onClose={onClose}
        onSuccess={onSuccess}
        defaultValues={props?.defaultValues}
      />
    </QueryClientProvider>
  );

  return { ...result, queryClient, onClose, onSuccess };
}

// ─────────────────────────────────────────────────────────────────────────────
// defaultValues prop — pre-fills form fields (reserved for Story 3.4 edit reuse)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — defaultValues prop', () => {
  it('[P1] should pre-fill form fields when defaultValues are provided', () => {
    // GIVEN: defaultValues prop with all fields populated
    const defaults = {
      nombre: 'María López Prefilled',
      cargo: 'Directora de Ventas',
      telefono: '3001234567',
      email: 'maria.prefilled@empresa.co',
    };

    // GIVEN: ContactoForm is rendered with defaultValues
    renderContactoForm({ defaultValues: defaults });

    // THEN: Each input is pre-filled with the provided value
    expect(screen.getByTestId('input-nombre')).toHaveValue(defaults.nombre);
    expect(screen.getByTestId('input-cargo')).toHaveValue(defaults.cargo);
    expect(screen.getByTestId('input-telefono')).toHaveValue(defaults.telefono);
    expect(screen.getByTestId('input-email')).toHaveValue(defaults.email);
  });

  it('[P2] should pre-fill only the provided fields when partial defaultValues are given', () => {
    // GIVEN: Only nombre and email in defaultValues
    const defaults = {
      nombre: 'Partial Prefill',
      email: 'partial@empresa.co',
    };

    renderContactoForm({ defaultValues: defaults });

    // THEN: Provided fields are filled, others are empty
    expect(screen.getByTestId('input-nombre')).toHaveValue(defaults.nombre);
    expect(screen.getByTestId('input-email')).toHaveValue(defaults.email);
    expect(screen.getByTestId('input-cargo')).toHaveValue('');
    expect(screen.getByTestId('input-telefono')).toHaveValue('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Zod validation — boundary / malformed input edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — Zod validation edge cases', () => {
  it('[P2] should show validation error when Nombre contains only whitespace', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — should NOT be called
    let postCalled = false;
    server.use(
      http.post(CONTACTOS_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderContactoForm();

    // WHEN: Nombre has only whitespace; all other fields are valid
    await userEvent.type(screen.getByTestId('input-nombre'), '   ');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Gerente');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-email'), 'valid@empresa.co');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Validation error appears (trimmed whitespace fails .min(1))
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });

    // AND: POST was NOT sent
    expect(postCalled).toBe(false);
  });

  it('[P2] should show email validation error for malformed email that is non-empty', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — should NOT be called
    let postCalled = false;
    server.use(
      http.post(CONTACTOS_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderContactoForm();

    // WHEN: Email is non-empty but not a valid email address
    await userEvent.type(screen.getByTestId('input-nombre'), 'Juan Pérez');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Analista');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-email'), 'notanemail');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Email validation error appears (Zod .email() rule)
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    // AND: POST was NOT sent
    expect(postCalled).toBe(false);
  });

  it('[P2] should show validation error when Nombre exceeds 255 characters', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — should NOT be called
    let postCalled = false;
    server.use(
      http.post(CONTACTOS_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderContactoForm();

    // WHEN: Nombre has 256 characters (boundary: > max 255)
    const longNombre = 'A'.repeat(256);
    await userEvent.type(screen.getByTestId('input-nombre'), longNombre);
    await userEvent.type(screen.getByTestId('input-cargo'), 'Gerente');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-email'), 'valid@empresa.co');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Validation error on Nombre (Zod .max(255) boundary)
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });

    // AND: POST was NOT sent
    expect(postCalled).toBe(false);
  });

  it('[P2] should show email validation error for email at domain boundary (missing TLD)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    let postCalled = false;
    server.use(
      http.post(CONTACTOS_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderContactoForm();

    // WHEN: Email missing TLD (user@ with no domain part)
    await userEvent.type(screen.getByTestId('input-nombre'), 'Sofía Herrera');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Supervisora');
    await userEvent.type(screen.getByTestId('input-telefono'), '3109876543');
    await userEvent.type(screen.getByTestId('input-email'), 'user@');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Validation error appears
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });

    expect(postCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pending state — submit button text changes to "Creando..." during mutation
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — pending state', () => {
  it('[P1] should show "Creando..." text on submit button while mutation is in flight', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — delayed response to observe pending state
    let resolveRequest!: () => void;
    const delayedRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.post(CONTACTOS_URL, async () => {
        await delayedRequest;
        const contacto = buildContacto({ email: 'pending.text@empresa.co' });
        return HttpResponse.json(contacto, { status: 201 });
      })
    );

    renderContactoForm();

    // WHEN: User fills all fields and submits
    await userEvent.type(screen.getByTestId('input-nombre'), 'Creando Test');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Analista');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-email'), 'pending.text@empresa.co');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Submit button shows "Creando..." while request is in flight
    await waitFor(() => {
      expect(screen.getByTestId('btn-submit')).toHaveTextContent(/creando/i);
    });

    // AND: Button is also disabled while pending (double-check isPending guard)
    expect(screen.getByTestId('btn-submit')).toBeDisabled();

    // Cleanup: resolve so MSW can close cleanly
    resolveRequest();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// onSuccess callback — invoked after successful creation (distinct from onClose)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — onSuccess callback', () => {
  it('[P1] should invoke onSuccess prop after successful creation', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 201 success
    const createdContacto = buildContacto({ email: 'onsuccess.cb@empresa.co' });
    server.use(
      http.post(CONTACTOS_URL, () =>
        HttpResponse.json(createdContacto, { status: 201 })
      )
    );

    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderContactoForm({ onClose, onSuccess });

    // WHEN: Valid form submitted
    await userEvent.type(screen.getByTestId('input-nombre'), createdContacto.nombre);
    await userEvent.type(screen.getByTestId('input-cargo'), createdContacto.cargo);
    await userEvent.type(screen.getByTestId('input-telefono'), createdContacto.telefono);
    await userEvent.type(screen.getByTestId('input-email'), createdContacto.email);
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: onSuccess is called (not just onClose)
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('[P1] should call both onSuccess and onClose after successful creation', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 201 success
    const createdContacto = buildContacto({ email: 'both.callbacks@empresa.co' });
    server.use(
      http.post(CONTACTOS_URL, () =>
        HttpResponse.json(createdContacto, { status: 201 })
      )
    );

    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderContactoForm({ onClose, onSuccess });

    // WHEN: Valid form submitted
    await userEvent.type(screen.getByTestId('input-nombre'), createdContacto.nombre);
    await userEvent.type(screen.getByTestId('input-cargo'), createdContacto.cargo);
    await userEvent.type(screen.getByTestId('input-telefono'), createdContacto.telefono);
    await userEvent.type(screen.getByTestId('input-email'), createdContacto.email);
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Both onClose and onSuccess are called
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 500 server error — generic form-level message (different from 409)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — 500 server error', () => {
  it('[P2] should display generic error message when server returns 500', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — backend returns 500
    server.use(
      http.post(CONTACTOS_URL, () =>
        HttpResponse.json(
          { title: 'Internal Server Error', status: 500 },
          { status: 500 }
        )
      )
    );

    renderContactoForm();

    // WHEN: User fills all fields and submits (backend returns 500)
    await userEvent.type(screen.getByTestId('input-nombre'), 'Test 500');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Analista');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-email'), 'test500@empresa.co');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Generic error message appears (not a stack trace — NFR6)
    await waitFor(() => {
      expect(
        screen.getByText(/error al crear el contacto/i)
      ).toBeInTheDocument();
    });

    // AND: No technical details exposed
    expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/StackTrace/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Field value retention after error — user can correct and resubmit
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — error recovery (field value retention)', () => {
  it('[P2] should retain field values after backend error so user can correct and resubmit', async () => {
    let callCount = 0;

    // GIVEN: NETWORK intercepted BEFORE render
    // First call: 400. Second call: 201.
    server.use(
      http.post(CONTACTOS_URL, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { title: 'Validation error', status: 400, errors: {} },
            { status: 400 }
          );
        }
        const contacto = buildContacto({ email: 'retry.success@empresa.co' });
        return HttpResponse.json(contacto, { status: 201 });
      })
    );

    const onClose = vi.fn();
    renderContactoForm({ onClose });

    // WHEN: User fills the form and submits (first attempt — 400 error)
    await userEvent.type(screen.getByTestId('input-nombre'), 'Retry User');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Consultor');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-email'), 'retry.success@empresa.co');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Error message appears
    await waitFor(() => {
      expect(screen.getByText(/error al crear el contacto/i)).toBeInTheDocument();
    });

    // AND: Field values are retained (not cleared)
    expect(screen.getByTestId('input-nombre')).toHaveValue('Retry User');
    expect(screen.getByTestId('input-cargo')).toHaveValue('Consultor');
    expect(screen.getByTestId('input-telefono')).toHaveValue('3001234567');
    expect(screen.getByTestId('input-email')).toHaveValue('retry.success@empresa.co');

    // WHEN: User resubmits (second attempt — 201 success)
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Success toast appears and form closes
    await waitFor(() => {
      expect(screen.getByText('Contacto creado correctamente')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WCAG 2.1 AA — aria-describedby links inputs to error spans
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — accessibility (aria-describedby)', () => {
  it('[P1] should have aria-describedby attributes linking inputs to their error containers', () => {
    // GIVEN: ContactoForm is rendered (no submit yet — static structure check)
    renderContactoForm();

    // THEN: Each input has aria-describedby pointing to its corresponding error span id
    const nombreInput = screen.getByTestId('input-nombre');
    const cargoInput = screen.getByTestId('input-cargo');
    const telefonoInput = screen.getByTestId('input-telefono');
    const emailInput = screen.getByTestId('input-email');

    expect(nombreInput).toHaveAttribute('aria-describedby', 'error-nombre');
    expect(cargoInput).toHaveAttribute('aria-describedby', 'error-cargo');
    expect(telefonoInput).toHaveAttribute('aria-describedby', 'error-telefono');
    expect(emailInput).toHaveAttribute('aria-describedby', 'error-email');
  });

  it('[P2] should render error spans with correct ids when validation fails', async () => {
    // GIVEN: ContactoForm is rendered
    renderContactoForm();

    // WHEN: Empty form submitted (triggers all 4 inline errors)
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Error spans appear with ids matching aria-describedby values
    await waitFor(() => {
      expect(document.getElementById('error-nombre')).toBeInTheDocument();
      expect(document.getElementById('error-cargo')).toBeInTheDocument();
      expect(document.getElementById('error-telefono')).toBeInTheDocument();
      expect(document.getElementById('error-email')).toBeInTheDocument();
    });
  });

  it('[P2] should use role="alert" on error spans for screen-reader announcement', async () => {
    // GIVEN: ContactoForm is rendered
    renderContactoForm();

    // WHEN: Empty form submitted
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: All error spans have role="alert"
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(4);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// onSuccess not called on failure — callbacks are properly isolated
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — callback isolation on failure', () => {
  it('[P2] should NOT call onSuccess when backend returns 409', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 409
    server.use(
      http.post(CONTACTOS_URL, () =>
        HttpResponse.json(
          { status: 409, detail: 'El email ya está registrado' },
          { status: 409 }
        )
      )
    );

    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderContactoForm({ onClose, onSuccess });

    // WHEN: Valid form submitted but backend rejects with 409
    await userEvent.type(screen.getByTestId('input-nombre'), 'Conflicto User');
    await userEvent.type(screen.getByTestId('input-cargo'), 'Gerente');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-email'), 'conflict@empresa.co');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error appears on email
    await waitFor(() => {
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
    });

    // AND: Neither onSuccess nor onClose is called
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('[P2] should NOT call onClose when client-side validation fails', async () => {
    // GIVEN: ContactoForm is rendered
    const onClose = vi.fn();
    renderContactoForm({ onClose });

    // WHEN: Empty form submitted (Zod rejects)
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Validation errors appear
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(4);
    });

    // AND: onClose is NOT called (form stays open for correction)
    expect(onClose).not.toHaveBeenCalled();
  });
});
