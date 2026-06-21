import { describe, it, expect } from 'vitest';
import { clienteSchema } from '../clienteSchema';

describe('clienteSchema', () => {
  describe('valid data', () => {
    it('passes when all required fields are provided', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Empresa Test SA',
        nit: '900123456-1',
        telefono: '+573001234567',
        ciudad: 'Bogotá',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid data — empty fields', () => {
    it('fails when nombre is empty', () => {
      const result = clienteSchema.safeParse({
        nombre: '',
        nit: '900123456-1',
        telefono: '+573001234567',
        ciudad: 'Bogotá',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.nombre).toBeDefined();
        expect(fieldErrors.nombre![0]).toBe('El nombre es requerido');
      }
    });

    it('fails when nit is empty and gives Spanish message', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Empresa Test SA',
        nit: '',
        telefono: '+573001234567',
        ciudad: 'Bogotá',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.nit).toBeDefined();
        expect(fieldErrors.nit![0]).toBe('El NIT/RUC es requerido');
      }
    });

    it('fails when telefono is empty', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Empresa Test SA',
        nit: '900123456-1',
        telefono: '',
        ciudad: 'Bogotá',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.telefono).toBeDefined();
        expect(fieldErrors.telefono![0]).toBe('El teléfono es requerido');
      }
    });

    it('fails when ciudad is empty', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Empresa Test SA',
        nit: '900123456-1',
        telefono: '+573001234567',
        ciudad: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.ciudad).toBeDefined();
        expect(fieldErrors.ciudad![0]).toBe('La ciudad es requerida');
      }
    });

    it('fails all four fields when all are empty', () => {
      const result = clienteSchema.safeParse({
        nombre: '',
        nit: '',
        telefono: '',
        ciudad: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.nombre).toBeDefined();
        expect(fieldErrors.nit).toBeDefined();
        expect(fieldErrors.telefono).toBeDefined();
        expect(fieldErrors.ciudad).toBeDefined();
      }
    });
  });
});
