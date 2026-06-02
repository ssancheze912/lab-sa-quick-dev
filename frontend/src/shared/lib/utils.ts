/**
 * Minimal className combiner — kept dependency-free.
 * Will be replaced by `clsx` + `tailwind-merge` (`cn`) when shadcn components are installed.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
