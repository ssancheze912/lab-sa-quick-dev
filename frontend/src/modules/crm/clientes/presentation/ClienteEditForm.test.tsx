/**
 * Story 2.4: Edit Client — ClienteEditForm Component Tests
 * Epic 2: Client Management
 *
 * Test IDs covered:
 *   TC-E2-P2-03: Required field cleared shows inline error; no submit fired
 *
 * Tooling: Vitest 2+ | @testing-library/react | MSW 2
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClienteEditForm } from './ClienteEditForm';
import type { Cliente } from '../domain/Cliente';

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function buildCliente(overrides?: Partial<Cliente>): Cliente {
  return {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    nombre: 'Empresa Ejemplo S.A.S.',
    nitRuc: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-06-17T14:30:00Z',
    ...overrides,
  };
}

function renderForm(cliente: Cliente, onSuccess = vi.fn(), onCancel = vi.fn()) {
  const queryClient = createQueryClient();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ClienteEditForm cliente={cliente} onSuccess={onSuccess} onCancel={onCancel} />
    </QueryClientProvider>
  );
  return { ...result, onSuccess, onCancel };
}

// ─────────────────────────────────────────────────────────────────────────────
// Form pre-fill test: form fields are pre-populated from cliente prop
// ─────────────────────────────────────────────────────────────────────────────

describe('Form pre-fill — fields are pre-populated with cliente values', () => {
  it('should pre-fill Nombre field with cliente.nombre', async () => {
    // ARRANGE
    const cliente = buildCliente();

    // ACT
    renderForm(cliente);

    // ASSERT — wait for the form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('Empresa Ejemplo S.A.S.');
  });

  it('should pre-fill all 4 fields with values from the cliente prop', async () => {
    // ARRANGE
    const cliente = buildCliente();

    // ACT
    renderForm(cliente);

    // ASSERT
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('Empresa Ejemplo S.A.S.');
    expect(screen.getByLabelText(/nit\/ruc/i)).toHaveValue('900123456-1');
    expect(screen.getByLabelText(/teléfono/i)).toHaveValue('3001234567');
    expect(screen.getByLabelText(/ciudad/i)).toHaveValue('Bogotá');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-03: Required field cleared shows inline error; no API request fired
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-03 — Clearing required field shows inline error, no submit', () => {
  it('should show inline error under Nombre when cleared and form submitted', async () => {
    // ARRANGE
    const user = userEvent.setup();
    const cliente = buildCliente();
    let putCalled = false;

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () => {
        putCalled = true;
        return HttpResponse.json(cliente, { status: 200 });
      })
    );

    renderForm(cliente);

    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    // ACT — clear Nombre and try to submit
    const nombreInput = screen.getByLabelText(/nombre/i);
    await user.clear(nombreInput);
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // ASSERT — inline error appears under Nombre
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // ASSERT — no PUT request was fired
    expect(putCalled).toBe(false);
  });

  it('should show inline error under NIT/RUC when cleared and form submitted', async () => {
    // ARRANGE
    const user = userEvent.setup();
    const cliente = buildCliente();
    let putCalled = false;

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () => {
        putCalled = true;
        return HttpResponse.json(cliente, { status: 200 });
      })
    );

    renderForm(cliente);

    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/nit\/ruc/i)).toBeInTheDocument();
    });

    // ACT
    const nitInput = screen.getByLabelText(/nit\/ruc/i);
    await user.clear(nitInput);
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // ASSERT — error shown
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // ASSERT — no API call
    expect(putCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cancel button: calls onCancel, does not fire PUT
// ─────────────────────────────────────────────────────────────────────────────

describe('Cancel button — calls onCancel without firing PUT', () => {
  it('should call onCancel when Cancelar button is clicked', async () => {
    // ARRANGE
    const user = userEvent.setup();
    const cliente = buildCliente();
    const onCancel = vi.fn();
    let putCalled = false;

    server.use(
      http.put(`*/api/v1/clientes/${cliente.id}`, () => {
        putCalled = true;
        return HttpResponse.json(cliente, { status: 200 });
      })
    );

    renderForm(cliente, vi.fn(), onCancel);

    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    // ACT
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // ASSERT
    expect(onCancel).toHaveBeenCalledOnce();
    expect(putCalled).toBe(false);
  });
});
