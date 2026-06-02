/**
 * Lowercase + diacritic-strip helper used by the client-side search filter.
 * Decoupled from React/TanStack so it can be unit-tested independently.
 *
 * Example: normalizeText('José') === 'jose'
 */
export function normalizeText(input: string): string {
  return input.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()
}
