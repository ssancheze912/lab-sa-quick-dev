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

const mockCliente = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  nombre: 'Empresa Test',
  nit: '900000001-1',
  telefono: '3000000001',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('useCliente', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('useCliente_WithValidId_ReturnsMappedCliente', async () => {
    // Arrange
    mockedGetById.mockResolvedValue(mockCliente);

    // Act
    const { result } = renderHook(
      () => useCliente(mockCliente.id),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(result.current.data).toEqual(mockCliente);
    expect(result.current.data?.nombre).toBe('Empresa Test');
    expect(result.current.data?.nit).toBe('900000001-1');
    expect(result.current.data?.telefono).toBe('3000000001');
    expect(result.current.data?.ciudad).toBe('Bogotá');
    expect(mockedGetById).toHaveBeenCalledWith(mockCliente.id);
  });

  it('useCliente_WithNonExistentId_ReturnsError', async () => {
    // Arrange
    mockedGetById.mockRejectedValue(new Error('Request failed with status code 404'));

    // Act
    const { result } = renderHook(
      () => useCliente('non-existent-id'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Assert
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('useCliente_WhenIdIsUndefined_DoesNotFetch', async () => {
    // Arrange — no mock setup needed since we assert no call is made

    // Act
    const { result } = renderHook(
      () => useCliente(undefined),
      { wrapper: createWrapper() },
    );

    // Assert — query disabled when id is falsy
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedGetById).not.toHaveBeenCalled();
  });
});
