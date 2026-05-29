import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../../infrastructure/repositories/clienteApiRepository';
import type { Cliente } from '../../domain/entities/Cliente';

export function useClientes() {
  const { data, isLoading, isError, refetch } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
    staleTime: 0,
  });

  return { data, isLoading, isError, refetch };
}
