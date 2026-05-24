import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export function useCliente(id: string | undefined) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id!),
    enabled: !!id,
    staleTime: 0,
    retry: 1,
  });

  return { data, isLoading, isError, error, refetch };
}
