import { createFileRoute, useNavigate, Outlet, useChildMatches } from '@tanstack/react-router';
import { ClienteListPanel } from '@/modules/crm/clientes/presentation/ClienteListPanel';
import { ClienteDetailPanel } from '@/modules/crm/clientes/presentation/ClienteDetailPanel';

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
});

function ClientesPage() {
  const navigate = useNavigate();
  const childMatches = useChildMatches();

  // If a child route ($clienteId) is matched, delegate rendering entirely to Outlet.
  // The child route (clientes.$clienteId.tsx) manages its own layout and active state.
  if (childMatches.length > 0) {
    return <Outlet />;
  }

  function handleClienteSelect(id: string) {
    navigate({ to: '/clientes/$clienteId', params: { clienteId: id } });
  }

  return (
    <div className="flex h-full">
      {/* Left panel — fixed 280px scrollable list, no active client */}
      <ClienteListPanel
        activeClienteId={undefined}
        onClienteSelect={handleClienteSelect}
      />

      {/* Right panel — placeholder (no client selected) */}
      <ClienteDetailPanel clienteId={undefined} />
    </div>
  );
}
