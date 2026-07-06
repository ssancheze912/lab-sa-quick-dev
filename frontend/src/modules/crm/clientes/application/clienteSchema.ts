import { z } from 'zod'

export const clienteSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  nit: z.string().trim().min(1, 'El NIT/RUC es requerido'),
  telefono: z.string().trim().min(1, 'El teléfono es requerido'),
  ciudad: z.string().trim().min(1, 'El campo Ciudad es requerido'),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
