/**
 * Story 2.4: ClienteForm — Edit Mode Tests (ATDD RED Phase)
 * Tests intentionally fail until ClienteForm edit mode is implemented.
 *
 * Acceptance Criteria covered:
 * - AC1: Form opens pre-filled with current values when mode='edit' and initialData provided
 * - AC2: Successful edit shows toast "Cliente actualizado correctamente" and calls onSuccess
 * - AC3: Clearing required field in edit mode shows inline error, no API call
 * - AC4: "Cancelar" closes form without making any request
 * - AC5: Backend unavailable → toast error "No se pudo actualizar el cliente. Intenta de nuevo.", form stays open
 * - AC6: 409 Conflict → inline error "El NIT/RUC ya está registrado" on NIT field
 *
 * Framework: Vitest + React Testing Library + MSW
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ClienteForm } from './ClienteForm';

// ─── Mock siesa-ui-kit toast ──────────────────────────────────────────────────

vi.mock('siesa-ui-kit', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from 'siesa-ui-kit';

// ─── MSW server ───────────────────────────────────────────────────────────────

const CLIENTE_ID = '550e8400-e29b-41d4-a716-446655440000';
const PUT_URL = `http://localhost:5000/api/v1/clientes/${CLIENTE_ID}`;

const updatedClienteStub = {
  id: CLIENTE_ID,
  nombre: 'Empresa Actualizada S.A.',
  nit: '900123456-7',
  telefono: '6019876543',
  ciudad: 'Medellín',
  createdAt: '2026-06-25T10:30:00Z',
  updatedAt: '2026-06-25T11:00:00Z',
};

const initialData = {
  nombre: 'Empresa Original S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
};

const server = setupServer(
  http.put(PUT_URL, () => HttpResponse.json(updatedClienteStub, { status: 200 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// ─── Helper wrapper + render ──────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

function renderEditForm(
  overrides: {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialDataOverride?: typeof initialData;
    clienteId?: string;
  } = {},
) {
  const {
    onSuccess = vi.fn(),
    onCancel = vi.fn(),
    initialDataOverride = initialData,
    clienteId = CLIENTE_ID,
  } = overrides;

  return render(
    createElement(
      createWrapper(),
      null,
      createElement(ClienteForm, {
        mode: 'edit',
        clienteId,
        initialData: initialDataOverride,
        onSuccess,
        onCancel,
      }),
    ),
  );
}

// ─── AC1: Form pre-filled with current values ─────────────────────────────────

describe('AC1 — Edit mode form is pre-filled with current values', () => {
  it('should pre-fill Nombre field with initialData value', () => {
    // GIVEN: ClienteForm is rendered in edit mode with initialData
    renderEditForm();

    // WHEN: Form is rendered
    const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;

    // THEN: Nombre is pre-filled
    expect(nombreInput.value).toBe('Empresa Original S.A.');
  });

  it('should pre-fill NIT/RUC field with initialData value', () => {
    // GIVEN: ClienteForm is rendered in edit mode with initialData
    renderEditForm();

    // WHEN: Form is rendered
    const nitInput = screen.getByLabelText('NIT/RUC') as HTMLInputElement;

    // THEN: NIT/RUC is pre-filled
    expect(nitInput.value).toBe('900123456-7');
  });

  it('should pre-fill Teléfono field with initialData value', () => {
    // GIVEN: ClienteForm is rendered in edit mode with initialData
    renderEditForm();

    // WHEN: Form is rendered
    const telefonoInput = screen.getByLabelText('Teléfono') as HTMLInputElement;

    // THEN: Teléfono is pre-filled
    expect(telefonoInput.value).toBe('6011234567');
  });

  it('should pre-fill Ciudad field with initialData value', () => {
    // GIVEN: ClienteForm is rendered in edit mode with initialData
    renderEditForm();

    // WHEN: Form is rendered
    const ciudadInput = screen.getByLabelText('Ciudad') as HTMLInputElement;

    // THEN: Ciudad is pre-filled
    expect(ciudadInput.value).toBe('Bogotá');
  });

  it('should display "Guardar cambios" as submit button label in edit mode', () => {
    // GIVEN: ClienteForm is rendered in edit mode
    renderEditForm();

    // WHEN: Form is rendered
    // THEN: Submit button shows "Guardar cambios" (not "Crear cliente")
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it('should have aria-label "Editar cliente" on the form in edit mode', () => {
    // GIVEN: ClienteForm in edit mode
    renderEditForm();

    // WHEN: Form is rendered
    // THEN: WCAG 2.1 AA — form aria-label is "Editar cliente"
    expect(screen.getByRole('form', { name: /editar cliente/i })).toBeInTheDocument();
  });
});

// ─── AC2: Successful edit ─────────────────────────────────────────────────────

describe('AC2 — Successful edit updates data and shows success toast', () => {
  it('should call PUT /api/v1/clientes/{id} with modified data on submit', async () => {
    // GIVEN: Edit form with initialData, user modifies Nombre
    const user = userEvent.setup();
    let capturedBody: unknown;

    server.use(
      http.put(PUT_URL, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(updatedClienteStub, { status: 200 });
      }),
    );

    renderEditForm();

    // WHEN: User clears Nombre and types a new value, then submits
    const nombreInput = screen.getByLabelText('Nombre');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Empresa Actualizada S.A.');

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: PUT request was made with updated nombre
    await waitFor(() => {
      expect(capturedBody).toMatchObject({ nombre: 'Empresa Actualizada S.A.' });
    });
  });

  it('should show toast "Cliente actualizado correctamente" after successful submit', async () => {
    // GIVEN: Edit form with initialData
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderEditForm({ onSuccess });

    // WHEN: User submits the form without changes (data is already valid)
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Success toast is displayed in Spanish
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Cliente actualizado correctamente');
    });
  });

  it('should call onSuccess after a successful edit', async () => {
    // GIVEN: Edit form with initialData
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderEditForm({ onSuccess });

    // WHEN: User submits the form
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: onSuccess is called (triggers form close in parent)
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });
});

// ─── AC3: Client-side Zod validation in edit mode ────────────────────────────

describe('AC3 — Clearing required field shows inline error, no API call', () => {
  it('should show "El nombre es requerido" when Nombre is cleared and submitted', async () => {
    // GIVEN: Edit form with initialData
    const user = userEvent.setup();
    let apiCalled = false;

    server.use(
      http.put(PUT_URL, () => {
        apiCalled = true;
        return HttpResponse.json(updatedClienteStub, { status: 200 });
      }),
    );

    renderEditForm();

    // WHEN: User clears Nombre and submits
    await user.clear(screen.getByLabelText('Nombre'));
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Inline error for nombre appears
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });
    expect(apiCalled).toBe(false);
  });

  it('should show "El NIT/RUC es requerido" when NIT/RUC is cleared and submitted', async () => {
    // GIVEN: Edit form with initialData
    const user = userEvent.setup();
    let apiCalled = false;

    server.use(
      http.put(PUT_URL, () => {
        apiCalled = true;
        return HttpResponse.json(updatedClienteStub, { status: 200 });
      }),
    );

    renderEditForm();

    // WHEN: User clears NIT/RUC and submits
    await user.clear(screen.getByLabelText('NIT/RUC'));
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Inline error for nit appears
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC es requerido')).toBeInTheDocument();
    });
    expect(apiCalled).toBe(false);
  });

  it('should NOT submit to the backend when a required field is cleared in edit mode', async () => {
    // GIVEN: Edit form with initialData
    const user = userEvent.setup();
    let apiCallCount = 0;

    server.use(
      http.put(PUT_URL, () => {
        apiCallCount++;
        return HttpResponse.json(updatedClienteStub, { status: 200 });
      }),
    );

    renderEditForm();

    // WHEN: User clears all fields and submits
    await user.clear(screen.getByLabelText('Nombre'));
    await user.clear(screen.getByLabelText('NIT/RUC'));
    await user.clear(screen.getByLabelText('Teléfono'));
    await user.clear(screen.getByLabelText('Ciudad'));
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: No API call is made (FR8 — frontend validation gate)
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });
    expect(apiCallCount).toBe(0);
  });
});

// ─── AC4: Cancelar without saving ────────────────────────────────────────────

describe('AC4 — Cancelar does not send any request', () => {
  it('should call onCancel when "Cancelar" button is clicked', async () => {
    // GIVEN: Edit form with initialData
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderEditForm({ onCancel });

    // WHEN: User clicks Cancelar
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // THEN: onCancel is called
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should NOT send any API request when "Cancelar" is clicked', async () => {
    // GIVEN: Edit form with initialData
    const user = userEvent.setup();
    let apiCalled = false;

    server.use(
      http.put(PUT_URL, () => {
        apiCalled = true;
        return HttpResponse.json(updatedClienteStub, { status: 200 });
      }),
    );

    renderEditForm();

    // WHEN: User clicks Cancelar without submitting
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // THEN: No API request was sent
    expect(apiCalled).toBe(false);
  });
});

// ─── AC5: Backend unavailable / 5xx ──────────────────────────────────────────

describe('AC5 — Network/5xx error shows toast error, form stays open with data preserved', () => {
  it('should display toast error "No se pudo actualizar el cliente. Intenta de nuevo." on 5xx', async () => {
    // GIVEN: Backend returns 500
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    renderEditForm({ onSuccess });

    // WHEN: User submits the edit form
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Error toast is shown in Spanish
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'No se pudo actualizar el cliente. Intenta de nuevo.',
      );
    });
  });

  it('should NOT call onSuccess when 5xx error occurs', async () => {
    // GIVEN: Backend returns 500
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderEditForm({ onSuccess });

    // WHEN: User submits
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    // THEN: Form stays open (onSuccess not called)
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should keep form fields visible after 5xx error (form remains open)', async () => {
    // GIVEN: Backend returns 500
    const user = userEvent.setup();

    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderEditForm();

    // WHEN: User submits and gets a 500 response
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());

    // THEN: Form fields are still visible (form is not closed)
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('NIT/RUC')).toBeInTheDocument();
  });

  it('should preserve entered data in form fields after 5xx error', async () => {
    // GIVEN: Edit form where user modified Nombre before 5xx error
    const user = userEvent.setup();

    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderEditForm();

    await user.clear(screen.getByLabelText('Nombre'));
    await user.type(screen.getByLabelText('Nombre'), 'Empresa Modificada');

    // WHEN: User submits and gets 500
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());

    // THEN: Entered data is still visible in the form
    const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
    expect(nombreInput.value).toBe('Empresa Modificada');
  });
});

// ─── AC6: 409 Conflict — duplicate NIT ───────────────────────────────────────

describe('AC6 — 409 Conflict shows inline NIT error', () => {
  it('should show inline error "El NIT/RUC ya está registrado" on NIT field when 409 is returned', async () => {
    // GIVEN: Backend returns 409 (another client already has this NIT)
    const user = userEvent.setup();

    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    renderEditForm();

    // WHEN: User submits the form
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Inline error appears on NIT field (NFR6 — no technical details exposed)
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });
  });

  it('should keep the form open after a 409 conflict response', async () => {
    // GIVEN: Backend returns 409
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict' },
          { status: 409 },
        ),
      ),
    );

    renderEditForm({ onSuccess });

    // WHEN: User submits
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });

    // THEN: Form is still open, onSuccess was NOT called
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  });
});

// ─── Loading state ────────────────────────────────────────────────────────────

describe('Loading state — submit button disabled while mutation is pending', () => {
  it('should show "Guardando…" label and disable submit button while edit mutation is pending', async () => {
    // GIVEN: Edit form with slow server response
    const user = userEvent.setup();

    server.use(
      http.put(PUT_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return HttpResponse.json(updatedClienteStub, { status: 200 });
      }),
    );

    renderEditForm();

    // WHEN: User clicks submit, mutation is in flight
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Button label changes to "Guardando…" and is disabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();
    });
  });
});
