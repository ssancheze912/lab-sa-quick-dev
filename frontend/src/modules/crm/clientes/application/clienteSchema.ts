import { z } from 'zod'

/**
 * Zod schema for the Create/Edit cliente form (Story 2.3 introduces it;
 * Story 2.4 reuses the same schema for edit). Messages match the backend
 * FluentValidation validator VERBATIM — R-006 parity anchor.
 */
export const clienteSchema = z.object({
  nombre: z.string().trim().min(1, { message: 'El nombre es obligatorio' }),
  nit: z.string().trim().min(1, { message: 'El NIT/RUC es obligatorio' }),
  telefono: z.string().trim().min(1, { message: 'El teléfono es obligatorio' }),
  ciudad: z.string().trim().min(1, { message: 'La ciudad es obligatoria' }),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
