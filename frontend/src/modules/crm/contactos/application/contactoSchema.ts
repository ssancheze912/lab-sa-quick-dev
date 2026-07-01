import { z } from 'zod'

const requiredMessage = 'Este campo es obligatorio'

export const contactoSchema = z.object({
  nombre: z.string().trim().min(1, { message: requiredMessage }),
  cargo: z.string().trim().min(1, { message: requiredMessage }),
  telefono: z.string().trim().min(1, { message: requiredMessage }),
  email: z.string().trim().min(1, { message: requiredMessage }),
})

export type ContactoFormValues = z.infer<typeof contactoSchema>
