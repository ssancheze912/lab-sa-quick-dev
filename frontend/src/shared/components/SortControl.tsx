export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc';

interface SortControlProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS = [
  { value: 'fecha-desc', label: 'Más reciente' },
  { value: 'fecha-asc', label: 'Más antiguo' },
  { value: 'nombre-asc', label: 'Nombre A→Z' },
  { value: 'nombre-desc', label: 'Nombre Z→A' },
];

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-control"
        className="text-sm font-normal text-slate-600 whitespace-nowrap"
      >
        Ordenar por:
      </label>
      <select
        data-testid="sort-control"
        id="sort-control"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        aria-label="Ordenar clientes"
        className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e79fd]"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
