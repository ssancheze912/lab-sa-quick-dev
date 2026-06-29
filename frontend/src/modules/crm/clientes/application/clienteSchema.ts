import { z } from 'zod'

export const clienteSchema = z.object({
  nombre: z.string().trim().min(1),
  nit: z.string().trim().min(1),
  telefono: z.string().trim().min(1),
  ciudad: z.string().trim().min(1),
})

export type ClienteFormData = z.infer<typeof clienteSchema>
