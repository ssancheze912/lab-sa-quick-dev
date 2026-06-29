export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'

interface SortControlProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <select
      data-testid="sort-control"
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className="text-sm border border-slate-200 rounded px-2 py-1 text-slate-700 bg-white"
    >
      <option value="fecha-desc">Más reciente</option>
      <option value="fecha-asc">Más antiguo</option>
      <option value="nombre-asc">Nombre A→Z</option>
      <option value="nombre-desc">Nombre Z→A</option>
    </select>
  )
}
