import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contactos/$contactoId')({
  component: ContactoDetailView,
})

function ContactoDetailView() {
  const { contactoId } = Route.useParams()

  return (
    <div data-testid="contacto-detail-view">
      <h2 className="text-2xl font-bold text-slate-900">Detalle de Contacto</h2>
      <p className="text-slate-600">{contactoId}</p>
    </div>
  )
}
