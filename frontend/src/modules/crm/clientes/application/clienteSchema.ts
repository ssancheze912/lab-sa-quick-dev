import { z } from 'zod'

// Max lengths mirror the backend's `ClienteConfiguration`/`CreateClienteRequestValidator`
// DB column limits (200/50/30/100) so an over-length value is blocked client-side with a
// clear message instead of only failing once it reaches the server.
export const clienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede superar los 200 caracteres'),
  nit: z
    .string()
    .trim()
    .min(1, 'El NIT/RUC es requerido')
    .max(50, 'El NIT/RUC no puede superar los 50 caracteres'),
  telefono: z
    .string()
    .trim()
    .min(1, 'El teléfono es requerido')
    .max(30, 'El teléfono no puede superar los 30 caracteres'),
  ciudad: z
    .string()
    .trim()
    .min(1, 'El campo Ciudad es requerido')
    .max(100, 'La ciudad no puede superar los 100 caracteres'),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
