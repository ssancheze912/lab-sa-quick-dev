import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../shared/components/ui/dialog'
import { useContactos } from '../../contactos/application/useContactos'
import { useAsociarContacto } from '../application/useAsociarContacto'

interface AsociarContactoDialogProps {
  clienteId: string
  open: boolean
  onClose: () => void
}

export function AsociarContactoDialog({ clienteId, open, onClose }: AsociarContactoDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedContactoId, setSelectedContactoId] = useState<string | null>(null)

  const { data: contactos, isLoading } = useContactos()
  const { mutate, isPending } = useAsociarContacto()

  const available = (contactos ?? []).filter((c) => c.clienteId !== clienteId)

  const filtered = available.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  )

  function handleConfirm() {
    if (!selectedContactoId) return
    mutate(
      { contactoId: selectedContactoId, clienteId },
      {
        onSuccess: () => {
          setSelectedContactoId(null)
          setSearch('')
          onClose()
        },
      }
    )
  }

  function handleCancel() {
    setSelectedContactoId(null)
    setSearch('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel() }}>
      <DialogContent aria-describedby={undefined} aria-labelledby="asociar-contacto-dialog-title">
        <DialogHeader>
          <DialogTitle id="asociar-contacto-dialog-title">Asociar contacto</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="mt-4 text-sm text-slate-400 text-center py-4">Cargando contactos...</div>
        ) : (
          <div data-testid="asociar-contacto-dialog" className="mt-2">
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                aria-label="Buscar contacto"
                placeholder="Buscar contacto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {filtered.length === 0 ? (
              <div data-testid="asociar-contacto-empty-state" className="text-sm text-slate-400 py-4 text-center">
                No hay contactos disponibles para asociar
              </div>
            ) : (
              <ul className="max-h-56 overflow-y-auto space-y-1">
                {filtered.map((contacto) => (
                  <li key={contacto.id}>
                    <button
                      type="button"
                      data-testid={`contacto-item-${contacto.id}`}
                      aria-pressed={selectedContactoId === contacto.id}
                      onClick={() => setSelectedContactoId(contacto.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedContactoId === contacto.id
                          ? 'bg-blue-100 text-blue-800 font-medium'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="font-medium">{contacto.nombre}</span>
                      {contacto.cargo && (
                        <span className="text-slate-500 ml-2 text-xs">{contacto.cargo}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !selectedContactoId}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Asociar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
