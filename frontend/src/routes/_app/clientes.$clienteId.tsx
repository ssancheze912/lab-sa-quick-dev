import { createFileRoute } from '@tanstack/react-router';
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView';

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailViewRoute,
});

function ClienteDetailViewRoute() {
  const { clienteId } = Route.useParams();
  return <ClienteDetailView clienteId={clienteId} />;
}
