import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ToastProvider } from 'siesa-ui-kit'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../shared/components/ui/dialog'
import { useClientes } from '../../clientes/application/useClientes'
import { useReasignarContacto } from '../application/useReasignarContacto'

interface ReasignarClienteDialogProps {
  contactoId: string
  currentClienteId: string
  open: boolean
  onClose: () => void
}

function ReasignarClienteDialogInner({
  contactoId,
  currentClienteId,
  open,
  onClose,
}: ReasignarClienteDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)

  const { data: clientes, isLoading } = useClientes()
  const { mutate, isPending } = useReasignarContacto()

  let _currentExcluded = false
  const available = (clientes ?? []).filter((c) => {
    if (c.id === currentClienteId && !_currentExcluded) {
      _currentExcluded = true
      return false
    }
    return true
  })

  const filtered = available.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  )

  function handleConfirm() {
    if (!selectedClienteId) return
    mutate(
      {
        contactoId,
        newClienteId: selectedClienteId,
        oldClienteId: currentClienteId,
      },
      {
        onSuccess: () => {
          setSelectedClienteId(null)
          setSearch('')
          onClose()
        },
      }
    )
  }

  function handleCancel() {
    setSelectedClienteId(null)
    setSearch('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel() }}>
      <DialogContent
        data-testid="reasignar-cliente-dialog"
        aria-describedby={undefined}
        aria-labelledby="reasignar-cliente-dialog-title"
      >
        <DialogHeader>
          <DialogTitle id="reasignar-cliente-dialog-title">Reasignar cliente</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="mt-4 text-sm text-slate-400 text-center py-4">Cargando clientes...</div>
        ) : (
          <div className="mt-2">
            <div className="relative mb-3">
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                aria-label="Buscar cliente"
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="text-sm text-slate-400 py-4 text-center">
                No hay otros clientes disponibles
              </div>
            ) : (
              <ul className="max-h-56 overflow-y-auto space-y-1">
                {filtered.map((cliente) => (
                  <li key={cliente.id}>
                    <button
                      type="button"
                      data-testid={`cliente-item-${cliente.id}`}
                      aria-pressed={selectedClienteId === cliente.id}
                      onClick={() => setSelectedClienteId(cliente.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedClienteId === cliente.id
                          ? 'bg-blue-100 text-blue-800 font-medium'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cliente.nombre}
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
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !selectedClienteId}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reasignar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ReasignarClienteDialog(props: ReasignarClienteDialogProps) {
  return (
    <ToastProvider>
      <ReasignarClienteDialogInner {...props} />
    </ToastProvider>
  )
}
