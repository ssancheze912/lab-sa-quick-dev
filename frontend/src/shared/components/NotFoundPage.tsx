import { Link } from '@tanstack/react-router'
import { Button } from 'siesa-ui-kit'

export function NotFoundPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      data-testid="not-found-page"
    >
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <p className="text-lg text-slate-600">Página no encontrada</p>
        <p className="text-sm text-slate-500">La ruta solicitada no existe.</p>
        <Link to="/clientes">
          <Button>Ir a Clientes</Button>
        </Link>
      </div>
    </div>
  )
}
