import { z } from 'zod'

export const createClienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  nit: z.string().min(1, 'NIT/RUC requerido'),
  telefono: z.string().min(1, 'Teléfono requerido'),
  ciudad: z.string().min(1, 'Ciudad requerida'),
})

export type CreateClienteFormData = z.infer<typeof createClienteSchema>

export const updateClienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  nit: z.string().min(1, 'NIT/RUC requerido'),
  telefono: z.string().min(1, 'Teléfono requerido'),
  ciudad: z.string().min(1, 'Ciudad requerida'),
})

export type UpdateClienteFormData = z.infer<typeof updateClienteSchema>
