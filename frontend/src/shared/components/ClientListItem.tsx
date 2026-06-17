import { Link } from '@tanstack/react-router';
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente';

interface ClientListItemProps {
  cliente: Cliente;
}

export function ClientListItem({ cliente }: ClientListItemProps) {
  return (
    <li
      role="listitem"
      data-testid="cliente-list-item"
      className="border-b border-slate-100 last:border-b-0 dark:border-slate-700"
    >
      <Link
        to="/clientes/$clienteId"
        params={{ clienteId: cliente.id }}
        className="flex flex-col gap-0.5 px-4 py-3 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0e79fd] dark:hover:bg-slate-800 dark:focus:bg-slate-800"
        activeProps={{
          className:
            'flex flex-col gap-0.5 px-4 py-3 cursor-pointer bg-blue-50 border-l-2 border-[#0e79fd] focus:outline-none dark:bg-slate-800',
          'aria-current': 'page' as const,
        }}
      >
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {cliente.nombre}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {cliente.nitRuc}
        </span>
      </Link>
    </li>
  );
}
