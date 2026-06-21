/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * Component Tests — ClienteForm (edit mode)
 * Uses: Vitest + React Testing Library + MSW (msw 2.x)
 *
 * Test Cases (edit-mode specific):
 *   TC-2.4-C-01 (P1): Render form with clienteId + defaultValues → all four fields pre-filled (R-008)
 *   TC-2.4-C-02 (P0): Clear Nombre, submit → inline error "El nombre es requerido", no PUT fired (FR8)
 *   TC-2.4-C-03 (P1): Mock PUT 200 → onSuccess called and toast "Cliente actualizado correctamente"
 *   TC-2.4-C-04 (P1): Click "Cancelar" after modifying field → onCancel called, no PUT fired (R-008)
 *   TC-2.4-C-05 (P1): Mock PUT 409 → "El NIT/RUC ya está registrado" on NIT field, no generic toast
 *   TC-2.4-C-06 (P1): isPending in edit mode → submit button disabled and shows "Guardando…"
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ClienteForm } from '../ClienteForm';

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/v1/clientes`;
const CLIENTE_ID = '00000000-0000-0000-0000-000000000042';
const PUT_URL = `${API_URL}/${CLIENTE_ID}`;

const server = setupServer(
  http.get(API_URL, () => HttpResponse.json([]))
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_VALUES = {
  nombre: 'Empresa Original SA',
  nit: '900111222-3',
  telefono: '+573001234567',
  ciudad: 'Bogotá',
};

const UPDATED_RESPONSE = {
  id: CLIENTE_ID,
  nombre: 'Empresa Editada SA',
  nit: '900111222-3',
  telefono: '+573001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-15T10:00:00+00:00',
  updatedAt: new Date().toISOString(),
};

function renderEditForm(props: {
  onSuccess?: () => void;
  onCancel?: () => void;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(ClienteForm, {
        clienteId: CLIENTE_ID,
        defaultValues: DEFAULT_VALUES,
        ...props,
      })
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-C-01 (P1): Form in edit mode has all four fields pre-filled with defaultValues (R-008)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.4-C-01 (P1): Edit mode — form pre-filled with current values', () => {
  it('renders all four fields pre-filled with provided defaultValues when clienteId is present', () => {
    // GIVEN: ClienteForm rendered in edit mode (clienteId + defaultValues)
    renderEditForm();

    // THEN: Nombre field has current value
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe(DEFAULT_VALUES.nombre);

    // AND: NIT/RUC field has current value
    expect((screen.getByLabelText('NIT/RUC') as HTMLInputElement).value).toBe(DEFAULT_VALUES.nit);

    // AND: Teléfono field has current value
    expect((screen.getByLabelText('Teléfono') as HTMLInputElement).value).toBe(DEFAULT_VALUES.telefono);

    // AND: Ciudad field has current value
    expect((screen.getByLabelText('Ciudad') as HTMLInputElement).value).toBe(DEFAULT_VALUES.ciudad);
  });

  it('shows "Guardar cambios" as submit button label in edit mode (not "Guardar cliente")', () => {
    // GIVEN: ClienteForm rendered in edit mode
    renderEditForm();

    // THEN: Submit button label is "Guardar cambios"
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();

    // AND: Create-mode label "Guardar cliente" is NOT present
    expect(screen.queryByRole('button', { name: /guardar cliente/i })).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-C-02 (P0): Clear Nombre → inline error, no PUT fired (FR8)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.4-C-02 (P0): Edit mode — clearing required field blocks submission', () => {
  it('shows inline error "El nombre es requerido" and fires no PUT when Nombre is cleared and form is submitted', async () => {
    let putCallMade = false;
    server.use(
      http.put(PUT_URL, () => {
        putCallMade = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    // GIVEN: ClienteForm rendered in edit mode
    renderEditForm();

    // WHEN: User clears the Nombre field
    const user = userEvent.setup();
    const nombreInput = screen.getByLabelText('Nombre');
    await user.clear(nombreInput);

    // WHEN: User clicks submit
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Inline error appears on Nombre field
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });

    // AND: No PUT request was fired (Zod validation blocked submission)
    expect(putCallMade).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-C-03 (P1): Mock PUT 200 → onSuccess called
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.4-C-03 (P1): Edit mode — successful update calls onSuccess', () => {
  it('calls onSuccess after 200 response from PUT', async () => {
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json(UPDATED_RESPONSE, { status: 200 })
      )
    );

    const onSuccess = vi.fn();

    // GIVEN: ClienteForm rendered in edit mode
    renderEditForm({ onSuccess });

    // WHEN: User modifies Nombre and submits
    const user = userEvent.setup();
    const nombreInput = screen.getByLabelText('Nombre');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Empresa Editada SA');

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: onSuccess is called once the mutation succeeds
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-C-04 (P1): Click "Cancelar" → onCancel called, no PUT fired (R-008)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.4-C-04 (P1): Edit mode — "Cancelar" calls onCancel without API call', () => {
  it('calls onCancel when "Cancelar" is clicked after modifying a field, with no PUT fired', async () => {
    let putCallMade = false;
    server.use(
      http.put(PUT_URL, () => {
        putCallMade = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    const onCancel = vi.fn();

    // GIVEN: ClienteForm rendered in edit mode with a modified field
    renderEditForm({ onCancel });

    const user = userEvent.setup();
    const nombreInput = screen.getByLabelText('Nombre');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Nombre No Guardado');

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // THEN: onCancel is called (dialog close driven by parent)
    expect(onCancel).toHaveBeenCalledTimes(1);

    // AND: No PUT request was made (R-008)
    expect(putCallMade).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-C-05 (P1): Mock PUT 409 → NIT field error, no generic toast (R-002)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.4-C-05 (P1): Edit mode — 409 response shows NIT field error, no generic toast', () => {
  it('shows "El NIT/RUC ya está registrado" on NIT field and no generic error toast for 409', async () => {
    server.use(
      http.put(PUT_URL, () =>
        HttpResponse.json(
          { title: 'El NIT/RUC ya está registrado.', status: 409 },
          { status: 409 }
        )
      )
    );

    // GIVEN: ClienteForm rendered in edit mode
    renderEditForm();

    // WHEN: User submits (current valid values trigger a 409 due to duplicate NIT on a different client)
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: NIT field shows inline error (not a toast)
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });

    // AND: No generic error toast visible in DOM (NFR6 — no stack traces)
    expect(document.body.innerHTML).not.toMatch(/No se pudo actualizar el cliente/i);
    expect(document.body.innerHTML).not.toMatch(/stackTrace/i);
    expect(document.body.innerHTML).not.toMatch(/exception/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-C-06 (P1): isPending in edit mode → submit disabled and shows "Guardando…"
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.4-C-06 (P1): Edit mode — isPending shows "Guardando…" and disables submit', () => {
  it('disables submit button and shows "Guardando…" while PUT mutation is pending', async () => {
    let resolveRequest!: () => void;
    server.use(
      http.put(PUT_URL, () =>
        new Promise<Response>((resolve) => {
          resolveRequest = () =>
            resolve(
              HttpResponse.json(UPDATED_RESPONSE, { status: 200 })
            );
        })
      )
    );

    // GIVEN: ClienteForm rendered in edit mode
    renderEditForm();

    // WHEN: User submits (valid data)
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: While PUT is pending, button is disabled and shows "Guardando…"
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /guardando/i });
      expect(btn).toBeDisabled();
      expect(btn).toHaveTextContent('Guardando…');
    });

    // Cleanup: resolve the pending request
    resolveRequest();
  });
});
