import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export function ContactosShellView() {
  return (
    <div data-testid="contactos-shell-view" className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Contactos</h1>
      <div data-testid="contactos-skeleton">
        <Skeleton count={5} height={48} className="mb-2" />
      </div>
    </div>
  )
}
