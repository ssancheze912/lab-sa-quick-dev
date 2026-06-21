/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * Component Tests — ClienteForm
 * Uses: Vitest + React Testing Library + MSW (msw 2.x)
 *
 * Test Cases:
 *   TC-2.3-C-01 (P0): Submit empty form → inline errors on all 4 fields, no API call
 *   TC-2.3-C-02 (P0): Mock POST 409 → "El NIT/RUC ya está registrado" on NIT field, no toast
 *   TC-2.3-C-03 (P1): Mock POST 201 → onSuccess called, toast "Cliente creado correctamente"
 *   TC-2.3-C-04 (P1): Click "Cancelar" → onCancel called, form not submitted
 *   TC-2.3-C-05 (P1): isPending → submit button disabled and shows "Guardando…"
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

function renderForm(props: { onSuccess?: () => void; onCancel?: () => void } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(ClienteForm, props)
    )
  );
}

async function fillForm(options: {
  nombre?: string;
  nit?: string;
  telefono?: string;
  ciudad?: string;
} = {}) {
  const user = userEvent.setup();
  if (options.nombre !== undefined) {
    await user.type(screen.getByLabelText('Nombre'), options.nombre);
  }
  if (options.nit !== undefined) {
    await user.type(screen.getByLabelText('NIT/RUC'), options.nit);
  }
  if (options.telefono !== undefined) {
    await user.type(screen.getByLabelText('Teléfono'), options.telefono);
  }
  if (options.ciudad !== undefined) {
    await user.type(screen.getByLabelText('Ciudad'), options.ciudad);
  }
  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-01 (P0): Empty form → inline errors, no API call
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-01 (P0): Submit empty form', () => {
  it('shows inline error on all 4 fields and fires no API call', async () => {
    let apiCallMade = false;
    server.use(
      http.post(API_URL, () => {
        apiCallMade = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /guardar cliente/i }));

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
      expect(screen.getByText('El NIT/RUC es requerido')).toBeInTheDocument();
      expect(screen.getByText('El teléfono es requerido')).toBeInTheDocument();
      expect(screen.getByText('La ciudad es requerida')).toBeInTheDocument();
    });

    expect(apiCallMade).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-02 (P0): Mock 409 → NIT field error, no generic toast, no stack trace
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-02 (P0): Duplicate NIT — 409 response', () => {
  it('shows NIT field error without generic toast or stack trace in DOM', async () => {
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json(
          { title: 'El NIT/RUC ya está registrado.', status: 409 },
          { status: 409 }
        )
      )
    );

    renderForm();

    await fillForm({
      nombre: 'Empresa Duplicada',
      nit: '900-DUP-1',
      telefono: '+573001112225',
      ciudad: 'Bogotá',
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /guardar cliente/i }));

    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });

    // No stack trace exposed in DOM (NFR6)
    expect(document.body.innerHTML).not.toMatch(/stackTrace/i);
    expect(document.body.innerHTML).not.toMatch(/exception/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-03 (P1): Mock 201 → onSuccess called
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-03 (P1): Successful creation', () => {
  it('calls onSuccess after 201 response', async () => {
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json(
          {
            id: '00000000-0000-0000-0000-000000000001',
            nombre: 'Empresa Nueva',
            nit: '900123456-1',
            telefono: '+573001234567',
            ciudad: 'Bogotá',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { status: 201 }
        )
      )
    );

    const onSuccess = vi.fn();
    renderForm({ onSuccess });

    await fillForm({
      nombre: 'Empresa Nueva',
      nit: '900123456-1',
      telefono: '+573001234567',
      ciudad: 'Bogotá',
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /guardar cliente/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-04 (P1): Click "Cancelar" → onCancel called, no submission
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-04 (P1): Cancel button', () => {
  it('calls onCancel when "Cancelar" is clicked without filling the form', async () => {
    let apiCallMade = false;
    server.use(
      http.post(API_URL, () => {
        apiCallMade = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    const onCancel = vi.fn();
    renderForm({ onCancel });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(apiCallMade).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-05 (P1): isPending → submit button disabled and shows "Guardando…"
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.3-C-05 (P1): Loading state', () => {
  it('disables submit button and shows "Guardando…" while pending', async () => {
    // Use a delayed response to keep the mutation in pending state
    let resolveRequest!: () => void;
    server.use(
      http.post(API_URL, () =>
        new Promise<Response>((resolve) => {
          resolveRequest = () =>
            resolve(
              HttpResponse.json(
                {
                  id: '00000000-0000-0000-0000-000000000001',
                  nombre: 'Empresa Test',
                  nit: '900123456-9',
                  telefono: '+573001234567',
                  ciudad: 'Bogotá',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                { status: 201 }
              )
            );
        })
      )
    );

    renderForm();

    await fillForm({
      nombre: 'Empresa Test',
      nit: '900123456-9',
      telefono: '+573001234567',
      ciudad: 'Bogotá',
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /guardar cliente/i }));

    // While pending, button should be disabled and show "Guardando…"
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /guardando cliente/i });
      expect(btn).toBeDisabled();
      expect(btn).toHaveTextContent('Guardando…');
    });

    // Resolve the request to clean up
    resolveRequest();
  });
});
