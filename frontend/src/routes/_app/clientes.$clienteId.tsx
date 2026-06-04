import { createFileRoute } from '@tanstack/react-router';
import { ClientesView } from '../../modules/crm/clientes/presentation/ClientesView';

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteIdPage,
});

function ClienteIdPage() {
  const { clienteId } = Route.useParams();
  return <ClientesView selectedClienteId={clienteId} />;
}
