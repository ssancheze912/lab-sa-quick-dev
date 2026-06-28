import { createFileRoute } from '@tanstack/react-router';
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView';
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView';

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailPage,
});

function ClienteDetailPage() {
  const { clienteId } = Route.useParams();
  return (
    <div className="flex h-full">
      <ClienteListView activeClienteId={clienteId} />
      <ClienteDetailView clienteId={clienteId} />
    </div>
  );
}
