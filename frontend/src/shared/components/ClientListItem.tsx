import type { Cliente } from '../../modules/crm/clientes/domain/Cliente';

interface ClientListItemProps {
  cliente: Cliente;
  isSelected: boolean;
  onClick: () => void;
}

export function ClientListItem({ cliente, isSelected, onClick }: ClientListItemProps) {
  return (
    <li
      role="listitem"
      data-testid="cliente-list-item"
      aria-label={`${cliente.nombre}, NIT/RUC: ${cliente.nit}`}
      aria-current={isSelected ? 'true' : undefined}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className={`flex flex-col px-4 py-3 cursor-pointer border-l-2 transition-colors ${
        isSelected
          ? 'border-[#0e79fd] bg-blue-50 text-[#0e79fd]'
          : 'border-transparent hover:bg-slate-50'
      }`}
    >
      <span className="text-sm font-medium text-slate-900 truncate">{cliente.nombre}</span>
      <span className="text-xs text-slate-500 truncate">{cliente.nit}</span>
    </li>
  );
}
