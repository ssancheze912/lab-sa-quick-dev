interface ContactoListItemProps {
  nombre: string
  cargo: string
  email: string
  isActive?: boolean
}

export function ContactoListItem({
  nombre,
  cargo,
  email,
  isActive = false,
}: ContactoListItemProps) {
  return (
    <div
      role="row"
      aria-current={isActive ? 'true' : undefined}
      className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-[#0e79fd]/10 border-l-2 border-[#0e79fd]'
          : 'hover:bg-slate-50'
      }`}
    >
      <span className="text-sm font-medium text-slate-800 truncate">{nombre}</span>
      <span className="text-xs text-slate-500 truncate">{cargo}</span>
      <span className="text-xs text-slate-400 truncate">{email}</span>
    </div>
  )
}
