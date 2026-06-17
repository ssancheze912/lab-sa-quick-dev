import { Outlet, createFileRoute } from '@tanstack/react-router';
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView';

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesLayout,
});

export function ClientesLayout() {
  return (
    <div className="flex h-full" data-testid="clientes-page">
      {/* Left panel — fixed 280px */}
      <aside className="w-[280px] shrink-0 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
        <ClienteListView />
      </aside>
      {/* Right panel — flex remainder */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
