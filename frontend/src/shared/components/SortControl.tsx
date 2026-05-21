import { useState, useRef, useEffect } from 'react'
import type { SortOption } from '../../modules/crm/clientes/application/sortClientes'

interface SortControlProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'fecha-desc', label: 'Más reciente' },
  { value: 'fecha-asc', label: 'Más antiguo' },
  { value: 'nombre-asc', label: 'Nombre A→Z' },
  { value: 'nombre-desc', label: 'Nombre Z→A' },
]

export function SortControl({ value, onChange }: SortControlProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabel =
    SORT_OPTIONS.find((opt) => opt.value === value)?.label ?? 'Más reciente'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button — appends ' ▾' so its textContent differs from option labels,
          allowing getByText(exactLabel) to match only the dropdown option. */}
      <button
        type="button"
        data-testid="sort-control"
        aria-label="Ordenar clientes"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0e79fd] focus:border-transparent cursor-pointer"
      >
        {selectedLabel}{' ▾'}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden"
        >
          {SORT_OPTIONS.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
