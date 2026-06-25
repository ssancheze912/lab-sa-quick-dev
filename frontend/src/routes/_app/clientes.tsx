import { createFileRoute, useNavigate, Outlet, useChildMatches } from '@tanstack/react-router';
import { ClienteListPanel } from '@/modules/crm/clientes/presentation/ClienteListPanel';
import { ClienteDetailPanel } from '@/modules/crm/clientes/presentation/ClienteDetailPanel';

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
});

function ClientesPage() {
  const navigate = useNavigate();
  const childMatches = useChildMatches();

  // Extract active clienteId from child route if present
  const activeClienteId = childMatches.length > 0
    ? (childMatches[0].params as { clienteId?: string }).clienteId
    : undefined;

  function handleClienteSelect(id: string) {
    navigate({ to: '/clientes/$clienteId', params: { clienteId: id } });
  }

  // If a child route ($clienteId) is matched, render the Outlet (it handles its own layout)
  if (childMatches.length > 0) {
    return <Outlet />;
  }

  return (
    <div className="flex h-full">
      {/* Left panel — fixed 280px scrollable list, no active client */}
      <ClienteListPanel
        activeClienteId={activeClienteId}
        onClienteSelect={handleClienteSelect}
      />

      {/* Right panel — placeholder (no client selected) */}
      <ClienteDetailPanel clienteId={undefined} />
    </div>
  );
}
