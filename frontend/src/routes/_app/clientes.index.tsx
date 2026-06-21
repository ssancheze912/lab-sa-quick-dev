import { createFileRoute } from '@tanstack/react-router';
import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView';

export const Route = createFileRoute('/_app/clientes/')({
  component: ClientesIndexComponent,
});

function ClientesIndexComponent() {
  return <ClienteDetailView clienteId={undefined} />;
}
