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

const POST_URL = 'http://localhost:5000/api/v1/clientes';

const clienteStub = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  nombre: 'Empresa Ejemplo S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
};

const server = setupServer(
  http.post(POST_URL, () => HttpResponse.json(clienteStub, { status: 201 })),
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

function renderForm(onSuccess = vi.fn(), onCancel = vi.fn()) {
  return render(
    createElement(
      createWrapper(),
      null,
      createElement(ClienteForm, { onSuccess, onCancel }),
    ),
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ClienteForm', () => {
  it('should render all four fields and both buttons', () => {
    renderForm();

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('NIT/RUC')).toBeInTheDocument();
    expect(screen.getByLabelText('Teléfono')).toBeInTheDocument();
    expect(screen.getByLabelText('Ciudad')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('should show inline errors for each empty field and NOT call the API', async () => {
    const user = userEvent.setup();
    let apiCalled = false;

    server.use(
      http.post(POST_URL, () => {
        apiCalled = true;
        return HttpResponse.json(clienteStub, { status: 201 });
      }),
    );

    renderForm();

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
      expect(screen.getByText('El NIT/RUC es requerido')).toBeInTheDocument();
      expect(screen.getByText('El teléfono es requerido')).toBeInTheDocument();
      expect(screen.getByText('La ciudad es requerida')).toBeInTheDocument();
    });

    expect(apiCalled).toBe(false);
  });

  it('should call API and fire onSuccess when form is submitted with valid data', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    renderForm(onSuccess);

    await user.type(screen.getByLabelText('Nombre'), 'Empresa Ejemplo S.A.');
    await user.type(screen.getByLabelText('NIT/RUC'), '900123456-7');
    await user.type(screen.getByLabelText('Teléfono'), '6011234567');
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(toast.success).toHaveBeenCalledWith('Cliente creado correctamente');
  });

  it('should show "Guardando…" and disable submit button while pending', async () => {
    const user = userEvent.setup();

    // Delay the server response to observe pending state
    server.use(
      http.post(POST_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return HttpResponse.json(clienteStub, { status: 201 });
      }),
    );

    renderForm();

    await user.type(screen.getByLabelText('Nombre'), 'Empresa');
    await user.type(screen.getByLabelText('NIT/RUC'), '900000000-0');
    await user.type(screen.getByLabelText('Teléfono'), '3001234567');
    await user.type(screen.getByLabelText('Ciudad'), 'Cali');

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // The button label changes to "Guardando…" while pending
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();
    });
  });

  it('should set inline NIT error on 409 conflict response', async () => {
    const user = userEvent.setup();

    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    renderForm();

    await user.type(screen.getByLabelText('Nombre'), 'Empresa');
    await user.type(screen.getByLabelText('NIT/RUC'), '900123456-7');
    await user.type(screen.getByLabelText('Teléfono'), '6011234567');
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá');

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });
  });

  it('should show toast error on 5xx response and keep form open', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    server.use(
      http.post(POST_URL, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );

    renderForm(onSuccess);

    await user.type(screen.getByLabelText('Nombre'), 'Empresa');
    await user.type(screen.getByLabelText('NIT/RUC'), '900000001-1');
    await user.type(screen.getByLabelText('Teléfono'), '3001234567');
    await user.type(screen.getByLabelText('Ciudad'), 'Medellín');

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'No se pudo crear el cliente. Intenta de nuevo.',
      );
    });

    // Form stays open — onSuccess not called
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  });

  it('should call onCancel and NOT send any API request when Cancelar is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    let apiCalled = false;

    server.use(
      http.post(POST_URL, () => {
        apiCalled = true;
        return HttpResponse.json(clienteStub, { status: 201 });
      }),
    );

    renderForm(vi.fn(), onCancel);

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(apiCalled).toBe(false);
  });
});
