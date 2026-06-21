interface ClientListItemProps {
  nombre: string;
  nit: string;
  onClick?: () => void;
}

export function ClientListItem({ nombre, nit, onClick }: ClientListItemProps) {
  return (
    <li
      data-testid="cliente-list-item"
      onClick={onClick}
      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 min-h-[44px]"
      role="listitem"
    >
      <p className="text-sm font-bold text-slate-800 truncate">{nombre}</p>
      <p className="text-xs text-slate-500 truncate">{nit}</p>
    </li>
  );
}
