import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export const useClientes = () =>
  useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
  });
