import { createFileRoute } from '@tanstack/react-router'
import { ClientesPage } from '../../modules/crm/clientes/presentation/ClientesPage'
import { queryClient } from '../../shared/lib/queryClient'
import { clienteRepository } from '../../modules/crm/clientes/infrastructure/clienteApiRepository'

export const Route = createFileRoute('/_app/clientes')({
  loader: () =>
    queryClient.prefetchQuery({
      queryKey: ['clientes'],
      queryFn: () => clienteRepository.getAll(),
      staleTime: Infinity,
    }).catch(() => undefined),
  component: ClientesPage,
})
