import { z } from 'zod'

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  nit: z.string().min(1, 'El NIT/RUC es requerido').max(50),
  telefono: z.string().min(1, 'El teléfono es requerido').max(50),
  ciudad: z.string().min(1, 'La ciudad es requerida').max(100),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
