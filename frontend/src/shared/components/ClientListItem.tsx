import type { Cliente } from '../../modules/crm/clientes/domain/entities/Cliente';

interface ClientListItemProps {
  cliente: Cliente;
  isActive?: boolean;
  onClick?: (id: string) => void;
}

export function ClientListItem({ cliente, isActive = false, onClick }: ClientListItemProps) {
  return (
    <div
      data-testid="cliente-list-item"
      role="listitem"
      aria-label={`Cliente: ${cliente.nombre}, NIT: ${cliente.nit}`}
      className={`px-4 py-3 cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-colors ${
        isActive ? 'bg-blue-50 border-l-4 border-l-[#0e79fd]' : ''
      }`}
      onClick={() => onClick?.(cliente.id)}
    >
      <p className="font-bold text-slate-800 truncate text-sm">{cliente.nombre}</p>
      <p className="text-slate-500 text-xs mt-0.5">{cliente.nit}</p>
    </div>
  );
}
