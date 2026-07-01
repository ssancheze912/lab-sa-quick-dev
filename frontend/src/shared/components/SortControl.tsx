import { Select, type SelectOption } from 'siesa-ui-kit'

export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc'

interface SortControlProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const SORT_OPTIONS: SelectOption[] = [
  { value: 'nombre-asc', label: 'Nombre A→Z' },
  { value: 'nombre-desc', label: 'Nombre Z→A' },
  { value: 'fecha-desc', label: 'Más reciente' },
  { value: 'fecha-asc', label: 'Más antiguo' },
]

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div data-testid="sort-control" onClickCapture={forwardClickToTrigger}>
      <Select
        options={SORT_OPTIONS}
        value={value}
        onChange={(newValue) => onChange(newValue as SortOption)}
        ariaLabel="Ordenar lista de clientes"
      />
    </div>
  )
}

/**
 * The `data-testid="sort-control"` lives on the wrapper `div` (siesa-ui-kit's
 * `Select` root node isn't directly addressable), but its actual interactive
 * trigger is the internal `<button>` rendered by `Select`. A click dispatched
 * directly on the wrapper does not reach the button's own click handling, so
 * when the click originates on the wrapper itself (not on a descendant),
 * forward it to the trigger button.
 */
function forwardClickToTrigger(event: React.MouseEvent<HTMLDivElement>) {
  if (event.target !== event.currentTarget) return
  const trigger = event.currentTarget.querySelector<HTMLButtonElement>('button')
  trigger?.click()
}
