import { Select } from 'siesa-ui-kit'

export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'

interface SortControlProps {
  value: SortOption
  onChange: (option: SortOption) => void
}

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'nombre-asc', label: 'Nombre A→Z' },
  { value: 'nombre-desc', label: 'Nombre Z→A' },
  { value: 'fecha-desc', label: 'Más reciente' },
  { value: 'fecha-asc', label: 'Más antiguo' },
]

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div data-testid="sort-control" aria-label="Ordenar clientes">
      <Select
        options={SORT_OPTIONS}
        value={value}
        onChange={(selected) => onChange(selected as SortOption)}
        ariaLabel="Ordenar clientes"
        showLabel={false}
        selectSize="sm"
      />
    </div>
  )
}
