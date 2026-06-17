/**
 * Story 2.3: Create Client — Component Tests
 * Epic 2: Client Management
 *
 * Test IDs covered:
 *   TC-E2-P0-04 — Submit empty form → 4 inline errors, no API call
 *   TC-E2-P0-05 — MSW 409 response → "El NIT/RUC ya está registrado" inline, no stack trace
 *
 * Tooling: Vitest 2+ | @testing-library/react | MSW 2
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClienteForm } from './ClienteForm';

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup — per-file handlers to avoid global test interference
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render ClienteForm with QueryClient and mocked callbacks
// ─────────────────────────────────────────────────────────────────────────────

function renderForm(overrides?: {
  onSuccess?: (c: unknown) => void;
  onClose?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onClose = overrides?.onClose ?? vi.fn();
  const onSuccess = overrides?.onSuccess;

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ClienteForm onClose={onClose} onSuccess={onSuccess} />
    </QueryClientProvider>,
  );
  return { ...utils, onClose, queryClient };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-04: Submit empty form → 4 inline errors, no API call
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P0-04 — Submit empty form shows 4 inline errors, no API call', () => {
  it('shows 4 inline error messages when form is submitted empty', async () => {
    // ARRANGE
    const user = userEvent.setup();
    let apiCalled = false;
    server.use(
      http.post('/api/v1/clientes', () => {
        apiCalled = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    renderForm();

    // ACT — find and click the submit button without filling in any fields
    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    // ASSERT — 4 inline error messages (role="alert")
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(4);
    });

    // ASSERT — no API call was fired
    expect(apiCalled).toBe(false);
  });

  it('shows error message for nombre when only nombre is empty', async () => {
    // ARRANGE
    const user = userEvent.setup();
    renderForm();

    // ACT — fill all fields except nombre
    await user.type(screen.getByLabelText(/NIT\/RUC/i), '900123456-1');
    await user.type(screen.getByLabelText(/teléfono/i), '3001234567');
    await user.type(screen.getByLabelText(/ciudad/i), 'Bogotá');

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    // ASSERT — error for nombre field
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const alertTexts = alerts.map((a) => a.textContent ?? '');
      expect(alertTexts.some((t) => t.toLowerCase().includes('nombre'))).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-05: MSW 409 response → inline "El NIT/RUC ya está registrado"
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P0-05 — 409 response shows inline NIT/RUC error, no stack trace', () => {
  it('shows inline "El NIT/RUC ya está registrado" on 409', async () => {
    // ARRANGE
    const user = userEvent.setup();
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json(
          { status: 409, title: 'Conflicto de datos', detail: 'El NIT/RUC ya está registrado' },
          { status: 409 },
        ),
      ),
    );

    renderForm();

    // ACT — fill all fields and submit
    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Duplicada S.A.S.');
    await user.type(screen.getByLabelText(/NIT\/RUC/i), '900111111-1');
    await user.type(screen.getByLabelText(/teléfono/i), '3001111111');
    await user.type(screen.getByLabelText(/ciudad/i), 'Bogotá');

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    // ASSERT — inline error message for nitRuc
    await waitFor(() => {
      expect(
        screen.getByText('El NIT/RUC ya está registrado'),
      ).toBeInTheDocument();
    });

    // ASSERT — no stack trace visible
    expect(screen.queryByText(/StackTrace/i)).toBeNull();
    expect(screen.queryByText(/System\./i)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cancel button closes form without API call
// ─────────────────────────────────────────────────────────────────────────────

describe('Cancel button — closes form, no API call', () => {
  it('calls onClose when Cancel is clicked without submitting', async () => {
    // ARRANGE
    const user = userEvent.setup();
    let apiCalled = false;
    server.use(
      http.post('/api/v1/clientes', () => {
        apiCalled = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const { onClose } = renderForm();

    // ACT — click the Cancelar button
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    // ASSERT — onClose called, no API call fired
    expect(onClose).toHaveBeenCalledOnce();
    expect(apiCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Successful submission — fires POST, invalidates query, calls onSuccess
// ─────────────────────────────────────────────────────────────────────────────

describe('Successful submission — POST fired, onSuccess called', () => {
  it('calls POST /api/v1/clientes and onSuccess callback on valid submission', async () => {
    // ARRANGE
    const user = userEvent.setup();
    const createdCliente = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      nombre: 'Empresa OK S.A.S.',
      nitRuc: '900999999-9',
      telefono: '3009999999',
      ciudad: 'Bogotá',
      createdAt: '2026-06-17T14:30:00Z',
    };

    let apiCallCount = 0;
    server.use(
      http.post('/api/v1/clientes', () => {
        apiCallCount++;
        return HttpResponse.json(createdCliente, { status: 201 });
      }),
    );

    const onSuccess = vi.fn();
    const { onClose } = renderForm({ onSuccess });

    // ACT — fill all fields and submit
    await user.type(screen.getByLabelText(/nombre/i), 'Empresa OK S.A.S.');
    await user.type(screen.getByLabelText(/NIT\/RUC/i), '900999999-9');
    await user.type(screen.getByLabelText(/teléfono/i), '3009999999');
    await user.type(screen.getByLabelText(/ciudad/i), 'Bogotá');

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    // ASSERT
    await waitFor(() => {
      expect(apiCallCount).toBe(1);
      expect(onSuccess).toHaveBeenCalledWith(createdCliente);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
