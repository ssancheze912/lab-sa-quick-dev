interface ClientListItemProps {
  id: string;
  nombre: string;
  nit: string;
  isSelected?: boolean;
  onClick: () => void;
}

export function ClientListItem({ id, nombre, nit, isSelected = false, onClick }: ClientListItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      data-testid={`client-item-${id}`}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`px-4 py-3 cursor-pointer border-l-4 ${
        isSelected
          ? 'border-l-[#0e79fd] bg-blue-50'
          : 'border-l-transparent hover:bg-slate-50'
      }`}
    >
      <p className="font-bold text-sm text-slate-800">{nombre}</p>
      <p className="text-xs text-slate-500">{nit}</p>
    </div>
  );
}
