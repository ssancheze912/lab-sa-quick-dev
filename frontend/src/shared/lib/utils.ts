import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines Tailwind class names, resolving conflicts.
 * Standard shadcn/ui helper — required by `components.json` `aliases.utils`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
