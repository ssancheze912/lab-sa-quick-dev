import { Select } from 'siesa-ui-kit'

export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'fecha-desc', label: 'Más reciente' },
  { value: 'fecha-asc', label: 'Más antiguo' },
  { value: 'nombre-asc', label: 'Nombre A→Z' },
  { value: 'nombre-desc', label: 'Nombre Z→A' },
]

export function sortClientes<T extends { nombre: string; createdAt: string }>(
  items: T[],
  sortOption: SortOption,
): T[] {
  const sorted = [...items]
  switch (sortOption) {
    case 'nombre-asc':
      return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre))
    case 'nombre-desc':
      return sorted.sort((a, b) => -a.nombre.localeCompare(b.nombre))
    case 'fecha-asc':
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    case 'fecha-desc':
      return sorted.sort(
        (a, b) => -(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      )
  }
}

export function SortControl({
  value,
  onChange,
}: {
  value: SortOption
  onChange: (value: SortOption) => void
}) {
  return (
    <div data-testid="sort-control">
      <Select
        options={SORT_OPTIONS}
        value={value}
        ariaLabel="Ordenar clientes"
        selectSize="sm"
        onChange={(newValue) => onChange(newValue as SortOption)}
      />
    </div>
  )
}
