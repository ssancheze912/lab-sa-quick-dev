import { Select } from 'siesa-ui-kit';
import type { SelectOption } from 'siesa-ui-kit';

export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc';

interface SortControlProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: SelectOption[] = [
  { value: 'fecha-desc', label: 'Más reciente' },
  { value: 'fecha-asc', label: 'Más antiguo' },
  { value: 'nombre-asc', label: 'Nombre A→Z' },
  { value: 'nombre-desc', label: 'Nombre Z→A' },
];

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div data-testid="sort-control" className="flex items-center gap-2">
      <label
        htmlFor="sort-control-select"
        className="text-sm font-normal text-slate-600 whitespace-nowrap"
      >
        Ordenar por:
      </label>
      <Select
        id="sort-control-select"
        options={SORT_OPTIONS}
        value={value}
        onChange={(v) => onChange(v as SortOption)}
        ariaLabel="Ordenar clientes"
        selectSize="sm"
        className="flex-1"
      />
    </div>
  );
}
