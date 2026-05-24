import { createFileRoute } from '@tanstack/react-router'
import { ClientesPlaceholderView } from '../../modules/crm/clientes/presentation/ClientesPlaceholderView'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPlaceholderView,
})
