import type { Cliente } from '@/modules/crm/clientes/domain/Cliente';

interface ClientListItemProps {
  cliente: Cliente;
  isActive: boolean;
  onClick: () => void;
}

export function ClientListItem({ cliente, isActive, onClick }: ClientListItemProps) {
  return (
    <li
      data-testid="cliente-list-item"
      role="option"
      aria-selected={isActive}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      className={[
        'cursor-pointer rounded-md px-3 py-2 transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd] focus-visible:ring-offset-1',
        isActive
          ? 'bg-[#0e79fd] text-white'
          : 'hover:bg-slate-100 text-slate-900',
      ].join(' ')}
    >
      <p className="text-sm font-bold truncate">{cliente.nombre}</p>
      <p className={['text-xs truncate', isActive ? 'text-blue-100' : 'text-slate-500'].join(' ')}>
        {cliente.nit}
      </p>
    </li>
  );
}
