import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useContactos } from '../application/useContactos'
import { EmptyState } from '../../../../shared/components/EmptyState'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

export function ContactoListView() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, isError, refetch } = useContactos()
  const navigate = useNavigate()

  const filteredContactos = useMemo(() => {
    if (!data) return []
    const q = searchQuery.toLowerCase().trim()
    if (!q) return data
    return data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    )
  }, [data, searchQuery])

  return (
    <div data-testid="contacto-list-view" className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-800 mb-3">Contactos</h1>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="contact-search-input"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-[#0e79fd]"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div data-testid="contacto-list-skeleton" className="p-4 space-y-2">
            <Skeleton height={48} count={5} />
          </div>
        )}

        {isError && <ErrorPanel onRetry={() => void refetch()} />}

        {!isLoading && !isError && filteredContactos.length === 0 && (
          <EmptyState message="No hay contactos registrados. Crea el primero." />
        )}

        {!isLoading && !isError && filteredContactos.length > 0 && (
          <section aria-label="Lista de contactos">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Cargo</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                </tr>
              </thead>
              <tbody>
                {filteredContactos.map((contacto) => (
                  <tr
                    key={contacto.id}
                    data-testid={`contact-list-item-${contacto.id}`}
                    onClick={() =>
                      void navigate({
                        to: '/contactos/$contactoId',
                        params: { contactoId: contacto.id },
                      })
                    }
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        void navigate({
                          to: '/contactos/$contactoId',
                          params: { contactoId: contacto.id },
                        })
                      }
                    }}
                  >
                    <td className="px-4 py-3 text-slate-800">{contacto.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{contacto.cargo}</td>
                    <td className="px-4 py-3 text-slate-600">{contacto.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  )
}
