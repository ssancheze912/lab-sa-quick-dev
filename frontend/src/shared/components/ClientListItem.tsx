interface ClientListItemProps {
  nombre: string
  nit: string
  isActive?: boolean
}

export function ClientListItem({ nombre, nit, isActive }: ClientListItemProps) {
  return (
    <div
      data-testid="cliente-list-item"
      role="listitem"
      aria-current={isActive ? 'true' : undefined}
      className={[
        'flex flex-col gap-0.5 px-3 py-2 rounded-lg cursor-pointer transition-colors',
        isActive
          ? 'bg-[#dbeefe] text-[#0e79fd]'
          : 'hover:bg-slate-100 text-slate-800',
      ].join(' ')}
    >
      <span className="text-sm font-medium leading-snug">{nombre}</span>
      <span
        className={[
          'text-xs leading-snug',
          isActive ? 'text-[#0e79fd]' : 'text-slate-500',
        ].join(' ')}
      >
        {nit}
      </span>
    </div>
  )
}
