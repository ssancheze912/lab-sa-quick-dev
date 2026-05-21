import { useToastStore } from '../lib/toastStore'

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={[
            'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white min-w-[240px] max-w-sm',
            toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-slate-700',
          ].join(' ')}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            aria-label="Cerrar notificación"
            className="shrink-0 text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
