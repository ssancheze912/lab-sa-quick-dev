import { z } from 'zod'

/**
 * Zod schema for the "Nuevo cliente" form. All four fields are required at the
 * form layer per FR1 — the backend only enforces Nombre + Nit (architectural
 * note in story 2.3 Dev Notes).
 *
 * The error copy `Este campo es requerido` matches the UX spec §Form Validation.
 */
export const clienteFormSchema = z.object({
  nombre: z.string().trim().min(1, 'Este campo es requerido').max(200, 'Nombre no puede exceder 200 caracteres'),
  nit: z.string().trim().min(1, 'Este campo es requerido').max(50, 'NIT/RUC no puede exceder 50 caracteres'),
  telefono: z.string().trim().min(1, 'Este campo es requerido').max(50, 'Teléfono no puede exceder 50 caracteres'),
  ciudad: z.string().trim().min(1, 'Este campo es requerido').max(100, 'Ciudad no puede exceder 100 caracteres'),
})

export type ClienteFormValues = z.infer<typeof clienteFormSchema>
