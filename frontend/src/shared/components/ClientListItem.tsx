import type { Cliente } from '../../modules/crm/clientes/domain/Cliente';

interface ClientListItemProps {
  cliente: Cliente;
  isSelected: boolean;
  onClick: () => void;
}

export function ClientListItem({ cliente, isSelected, onClick }: ClientListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-4 py-3 border-b border-slate-100 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0e79fd]',
        isSelected
          ? 'bg-[#0e79fd]/10 border-l-4 border-l-[#0e79fd]'
          : 'hover:bg-slate-50 border-l-4 border-l-transparent',
      ].join(' ')}
      aria-pressed={isSelected}
    >
      <p className="text-sm font-medium text-slate-800 truncate">{cliente.nombre}</p>
      <p className="text-xs text-slate-500 truncate mt-0.5">{cliente.nit}</p>
    </button>
  );
}
