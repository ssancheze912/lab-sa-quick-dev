import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ClienteListPanel } from '@/modules/crm/clientes/presentation/ClienteListPanel';
import { ClienteDetailPanel } from '@/modules/crm/clientes/presentation/ClienteDetailPanel';

export const Route = createFileRoute('/_app/clientes/$clienteId')({
  component: ClienteDetailPage,
});

function ClienteDetailPage() {
  const { clienteId } = Route.useParams();
  const navigate = useNavigate();

  function handleClienteSelect(id: string) {
    navigate({ to: '/clientes/$clienteId', params: { clienteId: id } });
  }

  return (
    <div className="flex h-full">
      {/* Left panel — fixed 280px scrollable list with active highlight */}
      <ClienteListPanel
        activeClienteId={clienteId}
        onClienteSelect={handleClienteSelect}
      />

      {/* Right panel — detail view for the selected client */}
      <ClienteDetailPanel clienteId={clienteId} />
    </div>
  );
}
