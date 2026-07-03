/**
 * Domain model for a commercial client (CRM).
 * `createdAt` / `updatedAt` are ISO-8601 strings with timezone offset — the
 * backend serialises `DateTimeOffset` this way. They are parsed on demand
 * by the UI, not eagerly.
 */
export interface Cliente {
  id: string
  nombre: string
  nitRuc: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}
