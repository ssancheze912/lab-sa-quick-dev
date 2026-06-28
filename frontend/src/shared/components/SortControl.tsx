import type { SortOption } from '../lib/sortClientes';

interface SortControlProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      aria-label="Ordenar clientes"
      data-testid="sort-control"
      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent bg-white text-slate-700"
    >
      <option value="fecha-desc">Más reciente</option>
      <option value="fecha-asc">Más antiguo</option>
      <option value="nombre-asc">Nombre A→Z</option>
      <option value="nombre-desc">Nombre Z→A</option>
    </select>
  );
}
