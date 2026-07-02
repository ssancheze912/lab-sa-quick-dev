import { UserGroupIcon, IdentificationIcon } from '@heroicons/react/24/outline'

/**
 * Static navigation catalogue for the Siesa Agents CRM shell.
 * User-facing labels are in Spanish (es-CO); ids/paths in English per company standards.
 */
export const NAV_ITEMS = [
  { id: 'clientes', label: 'Clientes', to: '/clientes', icon: UserGroupIcon },
  { id: 'contactos', label: 'Contactos', to: '/contactos', icon: IdentificationIcon },
] as const

export type NavItemId = (typeof NAV_ITEMS)[number]['id']
export type NavItemPath = (typeof NAV_ITEMS)[number]['to']
