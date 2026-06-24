import { z } from 'zod'

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  nit: z.string().min(1, 'El NIT/RUC es requerido').max(50, 'Máximo 50 caracteres'),
  telefono: z.string().min(1, 'El teléfono es requerido').max(30, 'Máximo 30 caracteres'),
  ciudad: z.string().min(1, 'La ciudad es requerida').max(100, 'Máximo 100 caracteres'),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
