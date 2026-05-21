import { z } from 'zod'

export const contactoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  cargo: z.string().min(1, 'El cargo es requerido').max(100),
  telefono: z.string().min(1, 'El teléfono es requerido').max(50),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('El email no tiene un formato válido')
    .max(200),
})

export type ContactoFormValues = z.infer<typeof contactoSchema>
