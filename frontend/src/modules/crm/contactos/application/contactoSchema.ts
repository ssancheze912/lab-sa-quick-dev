import { z } from 'zod'

// Raw Zod schema — use this with zodResolver(zodContactoSchema)
export const zodContactoSchema = z.object({
  nombre: z.string().trim().min(1, 'El campo Nombre es obligatorio.'),
  cargo: z.string().trim().min(1, 'El campo Cargo es obligatorio.'),
  telefono: z.string().trim().min(1, 'El campo Teléfono es obligatorio.'),
  email: z
    .string()
    .trim()
    .min(1, 'El campo Email es obligatorio.')
    .email('El email no tiene un formato válido'),
})

export type ContactoFormData = z.infer<typeof zodContactoSchema>

// Compatibility wrapper: adds `errors` alias for `issues` so tests written against
// Zod v3 API (result.error.errors) work with Zod v4 (which uses result.error.issues).
export const contactoSchema = {
  ...zodContactoSchema,
  safeParse(data: unknown) {
    const result = zodContactoSchema.safeParse(data)
    if (!result.success) {
      // Zod v4 uses `issues`; attach `errors` as alias for backward compat
      const err = result.error as typeof result.error & { errors: typeof result.error.issues }
      if (!err.errors) {
        Object.defineProperty(err, 'errors', {
          get() { return this.issues },
          enumerable: true,
          configurable: true,
        })
      }
    }
    return result
  },
  parse(data: unknown) {
    return zodContactoSchema.parse(data)
  },
}
