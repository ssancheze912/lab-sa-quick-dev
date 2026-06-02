/**
 * Cliente domain interface (Story 2.1).
 *
 * Mirrors the backend ClienteListItemDto contract:
 *   { id, nombre, nit, telefono, ciudad, createdAt, updatedAt }
 *
 * Timestamps are ISO-8601 strings (camelCase keys) — Axios returns the
 * JSON straight from .NET's System.Text.Json default serializer.
 */
export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}
