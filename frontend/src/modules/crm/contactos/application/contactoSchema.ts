import { z } from 'zod'

const _contactoSchema = z.object({
  nombre: z.string().trim().min(1),
  cargo: z.string().trim().min(1),
  telefono: z.string().trim().min(1),
  email: z.string().trim().min(1).email(),
})

export type ContactoFormData = z.infer<typeof _contactoSchema>

// Compatibility wrapper: adds `errors` alias for `issues` so tests written against
// Zod v3 API (result.error.errors) work with Zod v4 (which uses result.error.issues).
export const contactoSchema = {
  ..._contactoSchema,
  safeParse(data: unknown) {
    const result = _contactoSchema.safeParse(data)
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
    return _contactoSchema.parse(data)
  },
}
