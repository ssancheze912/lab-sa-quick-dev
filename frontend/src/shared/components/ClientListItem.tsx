interface ClientListItemProps {
  id: string
  nombre: string
  nit: string
  isSelected?: boolean
  onClick: () => void
}

export function ClientListItem({ nombre, nit, isSelected = false, onClick }: ClientListItemProps) {
  return (
    <li
      role="listitem"
      data-testid="cliente-list-item"
      aria-selected={isSelected}
      aria-label={nombre}
      onClick={onClick}
      className={`px-3 py-2 cursor-pointer ${
        isSelected
          ? 'bg-blue-50 text-blue-700'
          : 'hover:bg-slate-100'
      }`}
    >
      <p className="text-sm font-medium">{nombre}</p>
      <p className="text-xs text-slate-500">{nit}</p>
    </li>
  )
}
