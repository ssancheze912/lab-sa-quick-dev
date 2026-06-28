import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div data-testid="not-found-view">
      <h1>Página no encontrada</h1>
      <p>La ruta solicitada no existe.</p>
      <Link to="/clientes" data-testid="not-found-link-clientes">
        Ir a Clientes
      </Link>
    </div>
  )
}
