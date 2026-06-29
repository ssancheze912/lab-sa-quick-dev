import type { Contacto } from '../domain/Contacto'

interface ContactListItemProps {
  contacto: Contacto
}

export function ContactListItem({ contacto }: ContactListItemProps) {
  return (
    <div
      className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
      role="listitem"
      aria-label={`Contacto: ${contacto.nombre}, ${contacto.cargo}, ${contacto.email}`}
    >
      <p className="text-sm font-semibold text-slate-800">{contacto.nombre}</p>
      <p className="text-xs text-slate-500 mt-0.5">{contacto.cargo}</p>
      <p className="text-xs text-slate-400 mt-0.5">{contacto.email}</p>
    </div>
  )
}
