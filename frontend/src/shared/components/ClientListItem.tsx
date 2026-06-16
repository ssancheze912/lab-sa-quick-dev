import type { Cliente } from '../../modules/crm/clientes/domain/Cliente';

interface ClientListItemProps {
  cliente: Cliente;
  isSelected: boolean;
  onClick: () => void;
}

export function ClientListItem({ cliente, isSelected, onClick }: ClientListItemProps) {
  return (
    <li
      data-testid="cliente-list-item"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      aria-selected={isSelected}
      className={[
        'flex flex-col gap-0.5 px-4 py-3 cursor-pointer border-l-2 transition-colors',
        isSelected
          ? 'bg-blue-50 border-[#0e79fd]'
          : 'border-transparent hover:bg-slate-50',
      ].join(' ')}
    >
      <span className="text-sm font-semibold text-slate-800 truncate">{cliente.nombre}</span>
      <span className="text-xs text-slate-500 truncate">{cliente.nit}</span>
    </li>
  );
}
