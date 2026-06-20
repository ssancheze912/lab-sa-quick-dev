import { z } from 'zod'

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'Este campo es requerido'),
  nit: z.string().min(1, 'El NIT no puede estar vacío'),
  telefono: z.string().min(1, 'Este campo es requerido'),
  ciudad: z.string().min(1, 'Este campo es requerido'),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
