import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { ClienteForm } from './ClienteForm'

interface NuevoClienteDialogProps {
  open: boolean
  onClose: () => void
}

export function NuevoClienteDialog({ open, onClose }: NuevoClienteDialogProps) {
  const titleId = useId()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="nuevo-cliente-dialog"
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id={titleId}
            className="text-lg font-semibold text-slate-900"
          >
            Nuevo cliente
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <ClienteForm onClose={onClose} />
      </div>
    </div>,
    document.body,
  )
}
