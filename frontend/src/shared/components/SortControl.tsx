import type { SortOption } from '@/modules/crm/clientes/application/sortClientes'

interface SortControlProps {
  value: SortOption
  onChange: (next: SortOption) => void
  testId?: string
}

/**
 * Compact "Ordenar por" dropdown for the clientes list panel. Native
 * `<select>` styled with Tailwind — fully accessible, zero JS overhead,
 * respects OS theme. See Story 2.6 Dev Notes §"Why Native <select>".
 */
const OPTIONS: ReadonlyArray<{ value: SortOption; label: string }> = [
  { value: 'fecha-desc', label: 'Más reciente' },
  { value: 'fecha-asc', label: 'Más antiguo' },
  { value: 'nombre-asc', label: 'Nombre A→Z' },
  { value: 'nombre-desc', label: 'Nombre Z→A' },
]

export function SortControl({
  value,
  onChange,
  testId = 'clientes-sort-control',
}: SortControlProps) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-600">
      <span className="font-medium">Ordenar por</span>
      <select
        data-testid={testId}
        aria-label="Ordenar por"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e79fd]/40"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
