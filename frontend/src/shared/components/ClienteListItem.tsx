import type { KeyboardEvent } from 'react';
import type { Cliente } from '../../modules/crm/clientes/domain/Cliente';

interface ClienteListItemProps {
  cliente: Cliente;
  isActive?: boolean;
  onClick?: (cliente: Cliente) => void;
}

export function ClienteListItem({ cliente, isActive = false, onClick }: ClienteListItemProps) {
  const handleClick = () => onClick?.(cliente);
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(cliente);
    }
  };

  return (
    <div
      data-testid="cliente-list-item"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`px-3 py-2 cursor-pointer rounded transition-colors ${
        isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
      }`}
      aria-pressed={isActive}
    >
      <p className="text-sm font-semibold text-slate-800 truncate">{cliente.nombre}</p>
      <p className="text-xs text-slate-500 truncate">{cliente.nit}</p>
    </div>
  );
}
