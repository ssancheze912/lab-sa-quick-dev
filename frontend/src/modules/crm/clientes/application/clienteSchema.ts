import { z } from 'zod'

/**
 * Zod schema for the create/edit cliente form.
 *
 * `.trim()` runs BEFORE `.min(1)` so a whitespace-only value fails the
 * "required" check and emits the exact copy required by AC#3 (matches UX spec
 * validation). MaxLength values mirror the backend column limits (200/50/50/100)
 * to avoid frontend/backend drift.
 */
export const clienteFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  nit: z
    .string()
    .trim()
    .min(1, 'El NIT/RUC es requerido')
    .max(50, 'El NIT/RUC no puede exceder 50 caracteres'),
  telefono: z
    .string()
    .trim()
    .min(1, 'El teléfono es requerido')
    .max(50, 'El teléfono no puede exceder 50 caracteres'),
  ciudad: z
    .string()
    .trim()
    .min(1, 'La ciudad es requerida')
    .max(100, 'La ciudad no puede exceder 100 caracteres'),
})

export type ClienteFormValues = z.infer<typeof clienteFormSchema>
