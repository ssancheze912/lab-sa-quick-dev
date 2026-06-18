import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export function useCliente(id: string | undefined) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id!),
    enabled: !!id,
  });

  return { data, isLoading, isError, error, refetch };
}
