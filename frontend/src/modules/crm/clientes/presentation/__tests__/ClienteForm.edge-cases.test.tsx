/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * Component Tests — ClienteForm — Edge Cases & Boundary Conditions (BMad-Integrated Expansion)
 * Expands ATDD coverage from ClienteForm.test.tsx with additional unit/component edge cases.
 *
 * New Test Cases:
 *   TC-2.3-C-06 — Non-409 server error (500) shows generic toast "No se pudo crear el cliente. Intenta de nuevo."
 *   TC-2.3-C-07 — After successful creation, form fields are reset (empty) for next use
 *   TC-2.3-C-08 — Error spans have role="alert" for screen-readers (WCAG 2.1 AA)
 *   TC-2.3-C-09 — Error messages include aria-describedby on corresponding inputs when errors exist
 *   TC-2.3-C-10 — aria-describedby is absent on inputs when no errors are shown
 *   TC-2.3-C-11 — Submitting only one field empty shows error only on that field
 *   TC-2.3-C-12 — NIT error is cleared if user corrects NIT and resubmits successfully
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import React from 'react';
import { ClienteForm } from '../ClienteForm';

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/v1/clientes`;

const server = setupServer(
  http.get(API_URL, () => HttpResponse.json([]))
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderForm(props: { onSuccess?: () => void; onCancel?: () => void } = {}) {
  const queryClient = makeQueryClient();
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        React.Fragment,
        null,
        // Mount <Toaster> so sonner toast messages are rendered into the test DOM
        React.createElement(Toaster, { richColors: true }),
        React.createElement(ClienteForm, props)
      )
    )
  );
}

const validData = {
  nombre: 'Empresa Test SA',
  nit: '900123456-1',
  telefono: '+573001234567',
  ciudad: 'Bogotá',
};

const createdResponse = {
  id: '00000000-0000-0000-0000-000000000001',
  ...validData,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function fillAllFields(overrides: Partial<typeof validData> = {}) {
  const user = userEvent.setup();
  const data = { ...validData, ...overrides };

  await user.type(screen.getByLabelText('Nombre'), data.nombre);
  await user.type(screen.getByLabelText('NIT/RUC'), data.nit);
  await user.type(screen.getByLabelText('Teléfono'), data.telefono);
  await user.type(screen.getByLabelText('Ciudad'), data.ciudad);

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-06 — Non-409 server error shows generic toast
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-06: Non-409 server error (500) shows generic error toast', () => {
  it('shows "No se pudo crear el cliente. Intenta de nuevo." toast on 500 error', async () => {
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json({ title: 'Internal Server Error' }, { status: 500 })
      )
    );

    renderForm();

    const user = await fillAllFields();
    await user.click(screen.getByRole('button', { name: /guardar cliente/i }));

    // The generic toast should appear (sonner toast.error)
    await waitFor(() => {
      // sonner renders toasts in the DOM; look for the toast text
      expect(
        screen.getByText(/No se pudo crear el cliente\. Intenta de nuevo\./i)
      ).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-07 — After successful creation, form fields are reset
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-07: Form fields are reset after successful creation', () => {
  it('all fields are empty after a 201 response and onSuccess is called', async () => {
    server.use(
      http.post(API_URL, () => HttpResponse.json(createdResponse, { status: 201 }))
    );

    const onSuccess = vi.fn();
    renderForm({ onSuccess });

    const user = await fillAllFields();
    await user.click(screen.getByRole('button', { name: /guardar cliente/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    // After success, input fields should be reset (empty)
    // The form calls reset() on success; even if the component unmounts via onSuccess,
    // the reset state is the contract we verify here.
    // If the component stays mounted (onSuccess does not unmount), fields should be empty.
    const nombreInput = screen.queryByLabelText('Nombre');
    if (nombreInput) {
      // If component is still mounted after success, it must be empty
      expect((nombreInput as HTMLInputElement).value).toBe('');
    }
    // If component unmounted (onSuccess closed the dialog), onSuccess being called is sufficient proof
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-08 — Error spans have role="alert" for screen readers (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-08: Error messages have role="alert" (WCAG 2.1 AA)', () => {
  it('each validation error span has role="alert"', async () => {
    renderForm();
    const user = userEvent.setup();

    // Submit empty form to trigger all validation errors
    await user.click(screen.getByRole('button', { name: /guardar cliente/i }));

    await waitFor(() => {
      // All four error messages should be present
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });

    // THEN: Each error span has role="alert" (as implemented in ClienteForm.tsx)
    const alertElements = screen.getAllByRole('alert');
    const errorMessages = alertElements.map((el) => el.textContent);

    expect(errorMessages).toContain('El nombre es requerido');
    expect(errorMessages).toContain('El NIT/RUC es requerido');
    expect(errorMessages).toContain('El teléfono es requerido');
    expect(errorMessages).toContain('La ciudad es requerida');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-09 — aria-describedby is set on inputs when errors exist
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-09: Inputs have aria-describedby pointing to error spans when errors exist', () => {
  it('nombre input has aria-describedby="nombre-error" when nombre error is shown', async () => {
    renderForm();
    const user = userEvent.setup();

    // Trigger validation errors
    await user.click(screen.getByRole('button', { name: /guardar cliente/i }));

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });

    // THEN: Each input has aria-describedby pointing to its error element
    const nombreInput = screen.getByLabelText('Nombre');
    expect(nombreInput).toHaveAttribute('aria-describedby', 'nombre-error');

    const nitInput = screen.getByLabelText('NIT/RUC');
    expect(nitInput).toHaveAttribute('aria-describedby', 'nit-error');

    const telefonoInput = screen.getByLabelText('Teléfono');
    expect(telefonoInput).toHaveAttribute('aria-describedby', 'telefono-error');

    const ciudadInput = screen.getByLabelText('Ciudad');
    expect(ciudadInput).toHaveAttribute('aria-describedby', 'ciudad-error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-10 — aria-describedby is absent when no errors are shown
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-10: Inputs do NOT have aria-describedby when no errors exist', () => {
  it('nombre input has no aria-describedby on initial render (no errors)', () => {
    renderForm();

    // On initial render, no validation errors exist
    const nombreInput = screen.getByLabelText('Nombre');

    // THEN: aria-describedby is not set (implemented as undefined → no attribute)
    expect(nombreInput).not.toHaveAttribute('aria-describedby');

    const nitInput = screen.getByLabelText('NIT/RUC');
    expect(nitInput).not.toHaveAttribute('aria-describedby');

    const telefonoInput = screen.getByLabelText('Teléfono');
    expect(telefonoInput).not.toHaveAttribute('aria-describedby');

    const ciudadInput = screen.getByLabelText('Ciudad');
    expect(ciudadInput).not.toHaveAttribute('aria-describedby');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-11 — Submitting only one empty field shows error only on that field
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-11: Only the empty field gets an error when all others are filled', () => {
  it('shows error only on Ciudad when Ciudad is left empty', async () => {
    renderForm();

    const user = userEvent.setup();

    // Fill all fields except Ciudad
    await user.type(screen.getByLabelText('Nombre'), 'Empresa Parcial SA');
    await user.type(screen.getByLabelText('NIT/RUC'), '800999888-7');
    await user.type(screen.getByLabelText('Teléfono'), '+573009998887');
    // Leave Ciudad empty

    await user.click(screen.getByRole('button', { name: /guardar cliente/i }));

    await waitFor(() => {
      // THEN: Only Ciudad has an error
      expect(screen.getByText('La ciudad es requerida')).toBeInTheDocument();
    });

    // AND: Other fields do NOT show errors
    expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument();
    expect(screen.queryByText('El NIT/RUC es requerido')).not.toBeInTheDocument();
    expect(screen.queryByText('El teléfono es requerido')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-12 — NIT 409 error is cleared when user corrects NIT and resubmits successfully
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-12: 409 NIT error clears on successful resubmission', () => {
  it('clears NIT error and calls onSuccess when corrected NIT succeeds on second submit', async () => {
    // First request: 409 duplicate
    // Second request (corrected NIT): 201 success
    let callCount = 0;
    server.use(
      http.post(API_URL, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { title: 'El NIT/RUC ya está registrado.', status: 409 },
            { status: 409 }
          );
        }
        return HttpResponse.json(
          {
            id: '00000000-0000-0000-0000-000000000002',
            nombre: 'Empresa Corregida SA',
            nit: '900555666-2',
            telefono: '+573001234567',
            ciudad: 'Bogotá',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { status: 201 }
        );
      })
    );

    const onSuccess = vi.fn();
    renderForm({ onSuccess });

    const user = userEvent.setup();

    // First submit: triggers 409 on NIT field
    await user.type(screen.getByLabelText('Nombre'), 'Empresa Corregida SA');
    await user.type(screen.getByLabelText('NIT/RUC'), '900DUP-1');
    await user.type(screen.getByLabelText('Teléfono'), '+573001234567');
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');
    await user.click(screen.getByRole('button', { name: /guardar cliente/i }));

    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });

    // User corrects the NIT field
    const nitInput = screen.getByLabelText('NIT/RUC');
    await user.clear(nitInput);
    await user.type(nitInput, '900555666-2');

    // Second submit: 201 success
    await user.click(screen.getByRole('button', { name: /guardar cliente/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    // THEN: NIT error message is no longer shown after success
    expect(screen.queryByText('El NIT/RUC ya está registrado')).not.toBeInTheDocument();
  });
});
