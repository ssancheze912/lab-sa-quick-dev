import type { Cliente } from '../../modules/crm/clientes/domain/Cliente';

interface ClientListItemProps {
  cliente: Cliente;
  onClick?: (cliente: Cliente) => void;
}

export function ClientListItem({ cliente, onClick }: ClientListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(cliente)}
      className="w-full px-4 py-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-100 border-b border-slate-100 last:border-b-0"
      aria-label={`${cliente.nombre}, NIT: ${cliente.nit}`}
      data-testid="cliente-list-item"
    >
      <p className="text-sm font-semibold text-slate-900 truncate">{cliente.nombre}</p>
      <p className="text-xs text-slate-500 truncate mt-0.5">{cliente.nit}</p>
    </button>
  );
}
