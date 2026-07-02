import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from 'siesa-ui-kit'
import { useNavigate } from '@tanstack/react-router'

export interface NotFoundClientePanelProps {
  onBack?: () => void
  testId?: string
}

/**
 * Rendered inside the split-panel right side when GET /clientes/:id returns
 * 404. Local (panel-scoped) not-found — the app-level NotFoundView is only
 * used by the root router notFoundComponent. Uses `h3` so it does not
 * conflict with the list panel's `<h1>Clientes</h1>` heading.
 */
export function NotFoundClientePanel({
  onBack,
  testId = 'cliente-not-found',
}: NotFoundClientePanelProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    void navigate({ to: '/clientes' })
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid={testId}
      className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-amber-50">
        <ExclamationTriangleIcon
          className="size-10 text-amber-500"
          aria-hidden="true"
        />
      </div>
      {/*
        Heading level is `h2` (not `h3`): the NotFound panel REPLACES the
        detail panel — the `<h2>{cliente.nombre}</h2>` is not rendered
        alongside it — so only the list panel's `<h1>Clientes</h1>`
        precedes this heading. Using `h3` would skip a level and violate
        heading hierarchy (WCAG 2.4.6 / company standards WCAG 2.1 AA).
      */}
      <h2 className="text-base font-semibold text-slate-900">
        Cliente no encontrado
      </h2>
      <p className="text-sm text-slate-500">
        El cliente que buscas no existe o fue eliminado.
      </p>
      <div className="mt-2">
        <Button type="default" size="base" onClick={handleBack}>
          Volver a Clientes
        </Button>
      </div>
    </div>
  )
}
