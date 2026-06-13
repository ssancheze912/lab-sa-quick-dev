interface ClientListItemProps {
  nombre: string;
  nit: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ClientListItem({ nombre, nit, isSelected = false, onClick }: ClientListItemProps) {
  return (
    <button
      type="button"
      data-testid="cliente-list-item"
      onClick={onClick}
      className={[
        'w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors',
        isSelected ? 'bg-blue-50 border-l-2 border-l-[#0e79fd]' : '',
      ].join(' ')}
    >
      <p className="font-bold text-sm text-slate-900 truncate">{nombre}</p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">{nit}</p>
    </button>
  );
}
