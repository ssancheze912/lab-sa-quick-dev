import type { Cliente } from '../../modules/crm/clientes/domain/Cliente';

interface ClienteListItemProps {
  cliente: Cliente;
  isActive?: boolean;
  onClick?: (cliente: Cliente) => void;
}

export function ClienteListItem({ cliente, isActive = false, onClick }: ClienteListItemProps) {
  const handleClick = () => onClick?.(cliente);
  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
        isActive ? 'bg-slate-100' : ''
      }`}
      aria-label={`${cliente.nombre}, NIT: ${cliente.nit}`}
    >
      <p className="text-sm font-semibold text-slate-900 truncate">{cliente.nombre}</p>
      <p className="text-xs text-slate-500 truncate">{cliente.nit}</p>
    </div>
  );
}
