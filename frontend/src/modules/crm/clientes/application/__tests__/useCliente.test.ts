/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Unit Tests — RED Phase (Vitest + RTL + MSW)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — useCliente fetches and returns client data when id is valid
 *   AC2 — useCliente returns error state when client is not found (404)
 *   AC3 — useCliente does not fetch when id is undefined/null
 *
 * Hook under test: useCliente (not yet implemented)
 * Path: frontend/src/modules/crm/clientes/application/useCliente.ts
 *
 * Required behavior:
 *   - queryKey: ['clientes', id]
 *   - calls clienteApiRepository.getById(id)
 *   - staleTime: 30_000
 *   - enabled: !!id (disabled when id is falsy)
 *   - returns { data, isLoading, isError }
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clienteApiRepository } from '../../infrastructure/clienteApiRepository';
import { useCliente } from '../useCliente';

vi.mock('../../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

const mockedGetById = vi.mocked(clienteApiRepository.getById);

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const CLIENTE_FIXTURE = {
  id: 'a1b2c3d4-0001-0000-0000-000000000001',
  nombre: 'Empresa Alfa',
  nit: '900100200-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('useCliente', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── AC1: Valid id returns mapped client data ────────────────────────────────

  describe('useCliente_WithValidId_ReturnsMappedCliente', () => {
    it('should return isSuccess and the full client object when repository resolves', async () => {
      // Arrange
      mockedGetById.mockResolvedValue(CLIENTE_FIXTURE);

      // Act
      const { result } = renderHook(
        () => useCliente(CLIENTE_FIXTURE.id),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assert
      expect(result.current.data).toEqual(CLIENTE_FIXTURE);
      expect(mockedGetById).toHaveBeenCalledWith(CLIENTE_FIXTURE.id);
      expect(mockedGetById).toHaveBeenCalledTimes(1);
    });

    it('should return nombre from the resolved client data', async () => {
      // Arrange
      mockedGetById.mockResolvedValue(CLIENTE_FIXTURE);

      // Act
      const { result } = renderHook(
        () => useCliente(CLIENTE_FIXTURE.id),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assert
      expect(result.current.data?.nombre).toBe('Empresa Alfa');
    });

    it('should return nit from the resolved client data', async () => {
      // Arrange
      mockedGetById.mockResolvedValue(CLIENTE_FIXTURE);

      // Act
      const { result } = renderHook(
        () => useCliente(CLIENTE_FIXTURE.id),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assert
      expect(result.current.data?.nit).toBe('900100200-1');
    });

    it('should return telefono from the resolved client data', async () => {
      // Arrange
      mockedGetById.mockResolvedValue(CLIENTE_FIXTURE);

      // Act
      const { result } = renderHook(
        () => useCliente(CLIENTE_FIXTURE.id),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assert
      expect(result.current.data?.telefono).toBe('3001234567');
    });

    it('should return ciudad from the resolved client data', async () => {
      // Arrange
      mockedGetById.mockResolvedValue(CLIENTE_FIXTURE);

      // Act
      const { result } = renderHook(
        () => useCliente(CLIENTE_FIXTURE.id),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assert
      expect(result.current.data?.ciudad).toBe('Bogotá');
    });
  });

  // ─── AC2: Non-existent id returns error state ────────────────────────────────

  describe('useCliente_WithNonExistentId_ReturnsError', () => {
    it('should set isError to true when repository throws a 404-like error', async () => {
      // Arrange: The Axios interceptor throws when it receives a 404 response
      const notFoundError = Object.assign(new Error('Request failed with status code 404'), {
        response: { status: 404, data: { status: 404, title: 'Not Found', detail: 'El cliente no fue encontrado' } },
      });
      mockedGetById.mockRejectedValue(notFoundError);

      // Act
      const { result } = renderHook(
        () => useCliente('00000000-0000-0000-0000-000000000000'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Assert
      expect(result.current.data).toBeUndefined();
      expect(result.current.isError).toBe(true);
    });

    it('should NOT return data when the repository throws a 404 error', async () => {
      // Arrange
      const notFoundError = Object.assign(new Error('Request failed with status code 404'), {
        response: { status: 404 },
      });
      mockedGetById.mockRejectedValue(notFoundError);

      // Act
      const { result } = renderHook(
        () => useCliente('00000000-0000-0000-0000-000000000000'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Assert
      expect(result.current.data).toBeUndefined();
    });
  });

  // ─── AC3: Undefined/null id disables the query ───────────────────────────────

  describe('useCliente_WhenIdIsUndefined_DoesNotFetch', () => {
    it('should NOT call getById when id is undefined', async () => {
      // Arrange — hook called with undefined id

      // Act
      const { result } = renderHook(
        () => useCliente(undefined),
        { wrapper: createWrapper() }
      );

      // Wait briefly to ensure any potential async call would have fired
      await new Promise((r) => setTimeout(r, 50));

      // Assert
      expect(mockedGetById).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('should return isLoading false and no data when id is undefined', async () => {
      // Arrange

      // Act
      const { result } = renderHook(
        () => useCliente(undefined),
        { wrapper: createWrapper() }
      );

      // Assert — query is disabled, no loading state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should NOT call getById when id is empty string', async () => {
      // Arrange — empty string is falsy

      // Act
      renderHook(
        () => useCliente(''),
        { wrapper: createWrapper() }
      );

      await new Promise((r) => setTimeout(r, 50));

      // Assert
      expect(mockedGetById).not.toHaveBeenCalled();
    });
  });
});
