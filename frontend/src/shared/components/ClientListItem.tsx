interface ClientListItemProps {
  nombre: string
  nit: string
}

export function ClientListItem({ nombre, nit }: ClientListItemProps) {
  return (
    <div
      data-testid="cliente-list-item"
      className="p-3 border-b border-slate-200 hover:bg-slate-50 cursor-pointer min-h-[44px] flex flex-col justify-center"
    >
      <span className="text-sm font-medium text-slate-900 truncate">{nombre}</span>
      <span className="text-xs text-slate-500 truncate">{nit}</span>
    </div>
  )
}
