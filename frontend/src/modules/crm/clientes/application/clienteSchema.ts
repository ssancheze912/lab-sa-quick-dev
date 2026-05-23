import { z } from 'zod'

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre no puede superar 200 caracteres'),
  nit: z.string().min(1, 'El NIT/RUC es requerido').max(50, 'El NIT/RUC no puede superar 50 caracteres'),
  telefono: z.string().min(1, 'El teléfono es requerido').max(50, 'El teléfono no puede superar 50 caracteres'),
  ciudad: z.string().min(1, 'La ciudad es requerida').max(100, 'La ciudad no puede superar 100 caracteres'),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
