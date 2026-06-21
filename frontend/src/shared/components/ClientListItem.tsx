import { Link } from '@tanstack/react-router';

interface ClientListItemProps {
  id: string;
  nombre: string;
  nit: string;
}

export function ClientListItem({ id, nombre, nit }: ClientListItemProps) {
  return (
    <li
      data-testid="cliente-list-item"
      className="border-b border-slate-100 last:border-b-0"
      role="listitem"
    >
      <Link
        to="/clientes/$clienteId"
        params={{ clienteId: id }}
        className="block px-4 py-3 hover:bg-slate-50 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0e79fd]"
        activeProps={{ className: 'block px-4 py-3 bg-blue-50 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0e79fd]' }}
      >
        <p className="text-sm font-bold text-slate-800 truncate">{nombre}</p>
        <p className="text-xs text-slate-500 truncate">{nit}</p>
      </Link>
    </li>
  );
}
