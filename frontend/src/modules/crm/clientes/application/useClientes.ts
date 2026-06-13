import { useQuery } from '@tanstack/react-query';
import type { Cliente } from '../domain/Cliente';
import { clienteRepository } from '../infrastructure/clienteApiRepository';

export function useClientes() {
  return useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => clienteRepository.getAll(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retryOnMount: false,
  });
}
