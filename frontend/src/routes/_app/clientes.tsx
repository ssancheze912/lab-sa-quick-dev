import { createFileRoute } from '@tanstack/react-router'
import { ClienteListPanel } from '../../modules/crm/clientes/presentation/ClienteListPanel'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return (
    <div className="flex flex-row h-full">
      <ClienteListPanel />
      <div className="flex-1" />
    </div>
  )
}
