export function ClienteDetailPlaceholder() {
  return (
    <div
      role="region"
      aria-label="Sin cliente seleccionado"
      data-testid="cliente-detail-placeholder"
      className="flex-1 flex items-center justify-center text-slate-400 text-sm"
    >
      Selecciona un cliente para ver sus detalles.
    </div>
  )
}
