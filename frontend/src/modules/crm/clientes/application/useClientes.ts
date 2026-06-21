import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export function useClientes() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
    staleTime: 30_000,
  });

  return { data, isLoading, isError, refetch };
}
