import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos/')({
  component: ContactosIndexRoute,
})

function ContactosIndexRoute() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <p className="text-slate-400 text-sm">Selecciona un contacto para ver sus detalles</p>
    </div>
  )
}
