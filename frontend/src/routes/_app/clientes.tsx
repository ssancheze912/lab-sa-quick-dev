import { createFileRoute } from '@tanstack/react-router'
import { ClientesPage } from '../../modules/crm/clientes/presentation/ClientesPage'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})
