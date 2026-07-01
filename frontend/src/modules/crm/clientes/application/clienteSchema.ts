import { z } from 'zod'

const requiredMessage = 'Este campo es obligatorio'

export const clienteSchema = z.object({
  nombre: z.string().trim().min(1, { message: requiredMessage }),
  nit: z.string().trim().min(1, { message: requiredMessage }),
  telefono: z.string().trim().min(1, { message: requiredMessage }),
  ciudad: z.string().trim().min(1, { message: requiredMessage }),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
