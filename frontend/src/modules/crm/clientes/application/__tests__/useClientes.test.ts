import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clienteApiRepository } from '../../infrastructure/clienteApiRepository';
import { useClientes } from '../useClientes';

vi.mock('../../infrastructure/clienteApiRepository', () => ({
  clienteApiRepository: {
    getAll: vi.fn(),
  },
}));

const mockedGetAll = vi.mocked(clienteApiRepository.getAll);

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useClientes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns list of clients from repository', async () => {
    // Arrange
    const mockClientes = [
      { id: '1', nombre: 'Empresa A', nit: '900111111-1', telefono: '3001111111', ciudad: 'Bogotá', createdAt: '2026-01-01T00:00:00Z' },
      { id: '2', nombre: 'Empresa B', nit: '900222222-2', telefono: '3002222222', ciudad: 'Medellín', createdAt: '2026-01-02T00:00:00Z' },
    ];
    mockedGetAll.mockResolvedValue(mockClientes);

    // Act
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(result.current.data).toEqual(mockClientes);
    expect(mockedGetAll).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when repository returns no clients', async () => {
    // Arrange
    mockedGetAll.mockResolvedValue([]);

    // Act
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(result.current.data).toEqual([]);
  });
});
